import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1752196539597 implements MigrationInterface {
    name = 'AutoMigration1752196539597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`Alertas Ativos\` (\`id\` varchar(36) NOT NULL, \`time\` varchar(255) NOT NULL, \`aviso\` varchar(255) NOT NULL, \`data\` varchar(255) NULL, \`hora\` varchar(255) NULL, \`ip\` varchar(255) NOT NULL, \`nomeSistema\` varchar(255) NOT NULL, \`contato\` varchar(255) NOT NULL, \`localidade\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`mensagemOriginal\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`Alertas Ativos\``);
    }

}
