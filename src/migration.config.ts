import { DataSource } from 'typeorm';
import { ormConfig } from './ormconfig';

const datasource = new DataSource(ormConfig()); // config is one that is defined in datasource.config.ts file
datasource.initialize();
export default datasource;
