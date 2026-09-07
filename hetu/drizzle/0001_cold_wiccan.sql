CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`framework` varchar(64) NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`version` varchar(32) NOT NULL DEFAULT 'v1',
	`config` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`executionId` int,
	`name` varchar(160) NOT NULL,
	`status` enum('draft','running','completed') NOT NULL DEFAULT 'draft',
	`score` int,
	`rubric` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`externalId` varchar(120) NOT NULL,
	`framework` varchar(64) NOT NULL,
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'completed',
	`eventCount` int NOT NULL DEFAULT 0,
	`rootCause` varchar(160),
	`normalizedEvents` text NOT NULL,
	`metadata` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`name` varchar(160) NOT NULL,
	`status` enum('draft','running','completed') NOT NULL DEFAULT 'draft',
	`hypothesis` text NOT NULL,
	`config` text NOT NULL,
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
