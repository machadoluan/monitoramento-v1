import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1751920922447 implements MigrationInterface {
    name = 'AutoMigration1751920922447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`equipamentos\` ADD \`endereco\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` ADD \`lat\` float NULL`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` ADD \`lon\` float NULL`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`data\` \`data\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`hora\` \`hora\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`createdAt\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`mensagemOriginal\` \`mensagemOriginal\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`emails\` CHANGE \`createdAt\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`endereco\` \`endereco\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`tags\` \`tags\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`createdAt\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` CHANGE \`ultimaAtualizacao\` \`ultimaAtualizacao\` timestamp NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`equipamentos\` CHANGE \`ultimaAtualizacao\` \`ultimaAtualizacao\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`createdAt\` \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP()`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`tags\` \`tags\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`contratos\` CHANGE \`endereco\` \`endereco\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`emails\` CHANGE \`createdAt\` \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP()`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`mensagemOriginal\` \`mensagemOriginal\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`createdAt\` \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP()`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`hora\` \`hora\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`alerts\` CHANGE \`data\` \`data\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` DROP COLUMN \`lon\``);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` DROP COLUMN \`lat\``);
        await queryRunner.query(`ALTER TABLE \`equipamentos\` DROP COLUMN \`endereco\``);
        await queryRunner.query(`DROP TABLE \`EmailGroup\``);
        await queryRunner.query(`DROP TABLE \`emailsBlock\``);
    }

}
