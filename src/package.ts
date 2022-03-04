import { RequestHandler } from 'express';
import got from 'got';
import { DependencyDescriptor, NPMPackage } from './types';

/**
 * Attempts to retrieve package data from the npm registry and return it
 * Notes:
 * - Response returns the number of dependencies found on all packages, which occur greater than once
 * - Needs more testing
 * - Needs pretty JSON response (i.e. render html)
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;

  try {
    let allDependencies: NameVersion[] = [];
    
    const collectDeps: Collector = (result) => {
      allDependencies = allDependencies.concat(result)
    }

    await fetchFlattenedDependencyTree(name, version, collectDeps);

    const dependencyCounts = allDependencies.reduce((acc, [name]) => ({
      ...acc,
      [name]: acc[name] !== undefined ? acc[name] + 1 : 0,
    }), {} as {[name: string]: number });

    const transitiveDependencies = Object.entries(dependencyCounts)
      .filter(([, count]) => count > 1)
      .sort(([a], [b]) => a > b ? 1 : -1);

    return res.status(200).json({ name, version, transitiveDependencies });
  } catch (error) {
    return next(error);
  }
};

function fetchPackageData (name: string): Promise<NPMPackage> {
  return got(
    `https://registry.npmjs.org/${name}`
  ).json();
}

  // return npmPackage.versions[version]?.dependencies;

function getPackageDependencies(npmPackage: NPMPackage, version: string) {
  return npmPackage.versions[version]?.dependencies;
}

function flattenPackageDependencies(dependencies: DependencyDescriptor = {}): [string, string][] {
  return Object.entries(dependencies);
}

type NameVersion = [string, string];

type Collector = (deps: NameVersion[]) => void;

async function getPackageFlatDependencies(name: string, version: string): Promise<NameVersion[]> {
  const npmPackage = await fetchPackageData(name);
  const deps = getPackageDependencies(npmPackage, cleanSemverString(version));
  return flattenPackageDependencies(deps);
}

function cleanSemverString(semVer: string) {
  return semVer.replace(/[^0-9\.]/g, "");
}

async function fetchFlattenedDependencyTree(name: string, version: string, collector: Collector) {
  const flatDependencies = await getPackageFlatDependencies(name, version);

  collector(flatDependencies);

  return Promise.all(flatDependencies.map(([name, ver]) => {
    return fetchFlattenedDependencyTree(name, ver, collector);
  }))
}
