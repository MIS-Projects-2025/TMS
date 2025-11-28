-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: mis_ticketing
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ticket_request_types`
--

DROP TABLE IF EXISTS `ticket_request_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_request_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_data` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_request_types`
--

LOCK TABLES `ticket_request_types` WRITE;
/*!40000 ALTER TABLE `ticket_request_types` DISABLE KEYS */;
INSERT INTO `ticket_request_types` VALUES (1,'Network','Telephone',0,NULL,NULL),(2,'Network','CCTV',0,NULL,NULL),(3,'Network','Biometrics',0,NULL,NULL),(4,'Network','Access Door',0,NULL,NULL),(5,'Network','Sound System',0,NULL,NULL),(6,'Network','Internet/Wi-Fi Connection',0,NULL,NULL),(7,'Mail','Password Reset',0,NULL,NULL),(8,'Mail','New Account',0,NULL,NULL),(9,'Hardware','Desktop',1,NULL,NULL),(10,'Hardware','Laptop',1,NULL,NULL),(11,'Hardware','Server',1,NULL,NULL),(12,'Hardware','E-Learn Thin Client',1,NULL,NULL),(13,'Software','Portals/Apps',0,NULL,NULL),(14,'Software','MS Office',0,NULL,NULL),(15,'Software','SharePoint',0,NULL,NULL),(16,'Software','Zoom Meeting/MS Teams',0,NULL,NULL),(17,'Software','WhatsApp, Viber',0,NULL,NULL),(18,'Printer','Consigned Printer',1,NULL,NULL),(19,'Printer','Honeywell Printer',1,NULL,NULL),(20,'Printer','Zebra Printer',1,NULL,NULL),(21,'Promis','Account (Password Reset, Error)',0,NULL,NULL),(22,'Promis','Promis Terminal',1,NULL,NULL),(23,'Other Services','Assist Vendor or Supplier',0,NULL,NULL),(24,'Other Services','Virus Scanning and Transfer',0,NULL,NULL),(25,'Other Services','Others',0,NULL,NULL);
/*!40000 ALTER TABLE `ticket_request_types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-27 11:33:36
