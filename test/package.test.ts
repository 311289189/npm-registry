import * as getPort from 'get-port';
import got from 'got';
import { Server } from 'http';
import { createApp } from '../src/app';

describe('/package/:name/:version endpoint', () => {
  let server: Server;
  let port: number;

  beforeAll(async (done) => {
    port = await getPort();
    server = createApp().listen(port, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('responds', async () => {
    const packageName = 'react';
    const packageVersion = '16.13.0';

    const res: any = await got(
      `http://localhost:${port}/package/${packageName}/${packageVersion}`,
    ).json();

    expect(res.name).toEqual(packageName);
  });

  it('returns a list of transitive dependencies, sorted alphabatically', async () => {
    const packageName = 'create-react-app';
    const packageVersion = '5.0.0';

    const res: any = await got(
      `http://localhost:${port}/package/${packageName}/${packageVersion}`,
    ).json();

    expect(res.transitiveDependencies).toEqual(
      [
        [
          "fstream",
          2
        ],
        [
          "graceful-fs",
          4
        ],
        [
          "inherits",
          7
        ],
        [
          "minimatch",
          2
        ],
        [
          "mkdirp",
          2
        ],
        [
          "once",
          4
        ],
        [
          "readable-stream",
          2
        ],
        [
          "rimraf",
          4
        ],
        [
          "wrappy",
          2
        ]
      ]
    );
  });
});
