                                                                                                                                                                                                                                                                                                                                                                                                                                                                       pwm_backup.sql                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alerts` (
  `id` varchar(36) NOT NULL,
  `time` varchar(255) NOT NULL,
  `aviso` varchar(255) NOT NULL,
  `data` varchar(255) DEFAULT NULL,
  `hora` varchar(255) DEFAULT NULL,
  `ip` varchar(255) NOT NULL,
  `nomeSistema` varchar(255) NOT NULL,
  `contato` varchar(255) NOT NULL,
  `localidade` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mensagemOriginal` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
INSERT INTO `alerts` VALUES ('0131198b-09d6-4b2d-a2cf-65fb4c6a0d05','2025/06/05 17:51:34','NBK01 ( 192.168.4.175 ):  Carga Nobreak Normal','05/06/2025','17:51:34','192.168.4.175','NBK01','PWM Sistemas de Energia','Hippo Pedra Branca','Carga Nobreak Normal (22%)','2025-06-05 20:52:05.915869','Data/Hora: 2025/06/05 17:51:34 IP: 192.168.4.175 Nome Sistema: NBK01 Contato Sistema: PWM Sistemas de Energia Localidade Sistema: Hippo Pedra Branca Status: Carga Nobreak Normal (22%)'),('01389066-7266-4650-ac63-55573e4542fa','2025/06/09 14:32:45','NBK01 ( 192.168.4.175 ):  Carga Nobreak Normal','09/06/2025','14:32:45','192.168.4.175','NBK01','PWM Sistemas de Energia','Hippo Pedra Branca','Carga Nobreak Normal (21%)','2025-06-09 17:33:11.008210','Data/Hora: 2025/06/09 14:32:45 IP: 192.168.4.175 Nome Sistema: NBK01 Contato Sistema: PWM Sistemas de Energia Localidade Sistema: Hippo Pedra Branca Status: Carga Nobreak Normal (21%)'),('015e4893-6240-4a32-99b1-e>
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blockwords`
--

DROP TABLE IF EXISTS `blockwords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blockwords` (
  `id` varchar(36) NOT NULL,
  `word` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_ffbfe0dbf4ca64e7d388930cd0` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blockwords`
--

LOCK TABLES `blockwords` WRITE;
/*!40000 ALTER TABLE `blockwords` DISABLE KEYS */;
INSERT INTO `blockwords` VALUES ('e1b341ed-4d87-4961-92b5-75f5cbdf6b99','MENSAGEM NÃO ENTREGUE RETORNOU AO REMETENTE'),('3f44f71d-63e7-4e9f-9a43-b2f10c2bf9f4','MICHEL - DTI');
/*!40000 ALTER TABLE `blockwords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contratos`
--

DROP TABLE IF EXISTS `contratos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contratos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `telefone` varchar(255) NOT NULL,
  `endereco` varchar(255) NOT NULL,
  `tags` text,
  `sinal` tinyint(4) DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contratos`
--

LOCK TABLES `contratos` WRITE;
/*!40000 ALTER TABLE `contratos` DISABLE KEYS */;
/*!40000 ALTER TABLE `contratos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emails`
--

DROP TABLE IF EXISTS `emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `emails` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `chatId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emails`
--

LOCK TABLES `emails` WRITE;
/*!40000 ALTER TABLE `emails` DISABLE KEYS */;
INSERT INTO `emails` VALUES ('632b663c-f9d1-4da0-a51c-c4848f605251','contrato@pwmenergia.com.br','pwm2010','-4695689719','2025-06-02 11:52:10.247908'),('d2e48129-6ed4-4068-b0d0-443bd13a0105','alerta@pwmenergia.com.br','Pwm@2023','-4617186118','2025-06-02 11:50:20.250603');
/*!40000 ALTER TABLE `emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emailsBlock`
--

DROP TABLE IF EXISTS `emailsBlock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `emailsBlock` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emailsBlock`
--

LOCK TABLES `emailsBlock` WRITE;
/*!40000 ALTER TABLE `emailsBlock` DISABLE KEYS */;
INSERT INTO `emailsBlock` VALUES ('089442de-e227-4caa-94ff-563580ea56c0','MAILER-DAEMON@storagemail-cli-258.kinghost.net','2025-06-02 12:00:00.236877');
/*!40000 ALTER TABLE `emailsBlock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `keywords`
--

DROP TABLE IF EXISTS `keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `keywords` (
  `id` varchar(36) NOT NULL,
  `word` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_425ba5da298a62c2b3147524f6` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `keywords`
--

LOCK TABLES `keywords` WRITE;
/*!40000 ALTER TABLE `keywords` DISABLE KEYS */;
INSERT INTO `keywords` VALUES ('eeed3f99-09cf-4ade-a541-2de1148d253c','BYPASS'),('128929ef-949b-4850-b58c-8cd4fccc7796','CARGA NOBREAK ACIMA DOS LIMITES'),('f1c6f983-73ce-40ce-bf67-4f6dadc68be6','CARGA NOBREAK NORMAL'),('2e46a8db-05dc-478f-80c1-715b422a7967','DIAGNOSTICO INTERNO FALHOU'),('bb188e50-c784-447b-9404-d04f86e69106','FAILED'),('dd1280df-8851-4ce3-939b-9d3ea7f057ee','O NOBREAK ESTÁ ENTRANDO EM MODO BYPASS.'),('3b1eccef-2c2f-4da3-8374-9e9c0dd8cc04','TESTE LUAN');
/*!40000 ALTER TABLE `keywords` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-12 17:16:28