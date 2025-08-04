PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invite_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`created_by` text,
	`role` text DEFAULT 'user' NOT NULL,
	`expires_at` integer DEFAULT (unixepoch() + 86400) NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_invite_tokens`("token", "created_by", "role", "expires_at", "used", "created_at", "updated_at") SELECT "token", "created_by", "role", "expires_at", "used", "created_at", "updated_at" FROM `invite_tokens`;--> statement-breakpoint
DROP TABLE `invite_tokens`;--> statement-breakpoint
ALTER TABLE `__new_invite_tokens` RENAME TO `invite_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;