import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

function ormConfig(): DataSourceOptions {
  console.log(__dirname + '/migrations/**/*{.ts,.js}');

  const commonConf = {
    SYNCRONIZE: true,
    ENTITIES: [__dirname + '/entity/*.entity{.ts,.js}'],
    MIGRATIONS: [__dirname + '/database/migrations/**/*{.ts,.js}'],
    CLI: {
      migrationsDir: 'src/migrations',
    },
    MIGRATIONS_RUN: true,
  };

  let ormconfig: DataSourceOptions = {
    name: 'default',
    type: 'sqlite',
    database: '../target/db/sqlite-dev-db.sql',
    logging: true,
    synchronize: true,
    entities: commonConf.ENTITIES,
    migrations: commonConf.MIGRATIONS,
    migrationsRun: commonConf.MIGRATIONS_RUN,
  };
  if (process.env.BACKEND_ENV === 'dev') {
    ormconfig = {
      name: 'default',
      type: 'mysql',
      database: 'new-2all-dev',
      host: 'localhost',
      port: 3308,
      username: 'root',
      password: 'P@ssW0rd',
      logging: false,
      synchronize: commonConf.SYNCRONIZE,
      entities: commonConf.ENTITIES,
      migrations: commonConf.MIGRATIONS,
      migrationsRun: commonConf.MIGRATIONS_RUN,
    };
  }

  // if (process.env.BACKEND_ENV === 'prod') {
  //   ormconfig = {
  //     host: process.env.DB_HOST,
  //     port: parseInt(process.env.DB_PORT),
  //     username: process.env.DB_USERNAME,
  //     password: process.env.DB_PASSWORD,
  //     name: process.env.DB_NAME,
  //     entities: [],
  //     migrations: [],
  //     migrationsRun: false,
  //     synchronize: false,
  //   };
  // }

  if (process.env.BACKEND_ENV === 'test') {
    ormconfig = {
      name: 'default',
      type: 'sqlite',
      database: ':memory:',
      logging: true,
      synchronize: true,
      entities: commonConf.ENTITIES,
      migrations: commonConf.MIGRATIONS,
      migrationsRun: commonConf.MIGRATIONS_RUN,
    };
  }
  return ormconfig;
}

export { ormConfig };
