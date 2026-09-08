CREATE TABLE `agentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`version` varchar(32) NOT NULL,
	`status` enum('draft','staged','production','archived') NOT NULL DEFAULT 'draft',
	`config` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`executionId` int NOT NULL,
	`decisiveStep` varchar(160),
	`category` varchar(64) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`confidence` int NOT NULL,
	`rootCause` text NOT NULL,
	`recommendation` text NOT NULL,
	`alternatives` text NOT NULL,
	`propagation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leftExecutionId` int NOT NULL,
	`rightExecutionId` int NOT NULL,
	`summary` text NOT NULL,
	`changes` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diffs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`analysisId` int NOT NULL,
	`executionId` int NOT NULL,
	`eventId` varchar(120) NOT NULL,
	`kind` enum('observable','inferred') NOT NULL,
	`claim` text NOT NULL,
	`source` text NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propagation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`analysisId` int NOT NULL,
	`fromEventId` varchar(120) NOT NULL,
	`toEventId` varchar(120) NOT NULL,
	`relation` varchar(32) NOT NULL,
	`impact` enum('low','medium','high') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propagation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replayResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`replayId` int NOT NULL,
	`resultExecutionId` int,
	`status` enum('completed','failed') NOT NULL,
	`summary` text NOT NULL,
	`divergence` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `replayResults_id` PRIMARY KEY(`id`)
);
