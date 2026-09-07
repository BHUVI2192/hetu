CREATE TABLE `evaluationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`executionId` int NOT NULL,
	`score` int NOT NULL,
	`quality` int NOT NULL,
	`groundedness` int NOT NULL,
	`trajectory` int NOT NULL,
	`latency` int NOT NULL,
	`cost` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`executionId` int NOT NULL,
	`snapshotId` int,
	`name` varchar(160) NOT NULL,
	`changes` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`executionId` int NOT NULL,
	`snapshotId` int,
	`mode` enum('sandbox','mock_tools','recorded_tools','read_only') NOT NULL DEFAULT 'sandbox',
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`overrides` text NOT NULL,
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `replays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`executionId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`stepId` varchar(120) NOT NULL,
	`state` text NOT NULL,
	`metadata` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
