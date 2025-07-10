import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1752169082943 implements MigrationInterface {
    name = 'AutoMigration1752169082943'

    public async up(queryRunner: QueryRunner): Promise<void> {
   
        await queryRunner.query(`ALTER TABLE \`equipamentos\` ADD \`contrato\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`equipamentos\` CHANGE \`lon\` \`lon\` float(12) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` CHANGE \`lat\` \`lat\` float(12) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` CHANGE \`ultimaAtualizacao\` \`ultimaAtualizacao\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP()`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` CHANGE \`endereco\` \`endereco\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`tags\` \`tags\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`endereco\` \`endereco\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`mensagemOriginal\` \`mensagemOriginal\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`hora\` \`hora\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`data\` \`data\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` DROP COLUMN \`contrato\``);
        await queryRunner.query(`DROP TABLE \`EmailGroup\``);
        await queryRunner.query(`DROP TABLE \`emailsBlock\``);
    }

}
