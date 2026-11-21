CREATE TABLE "consent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"choice" text NOT NULL,
	"notice_version" text NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text DEFAULT 'web_form' NOT NULL,
	CONSTRAINT "consent_purpose_chk" CHECK ("consent_events"."purpose" in ('inquiry_processing','marketing')),
	CONSTRAINT "consent_choice_chk" CHECK ("consent_events"."choice" in ('acknowledged','granted','declined'))
);
--> statement-breakpoint
CREATE TABLE "lead_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"adult_name" text NOT NULL,
	"mobile_e164" text NOT NULL,
	"program_id" text NOT NULL,
	"intent" text NOT NULL,
	"comment" text,
	"locale" text NOT NULL,
	"zone_id" text,
	"source" text,
	"notice_version" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"status_updated_at" timestamp with time zone,
	"idempotency_key" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"group_key" text NOT NULL,
	"is_repeat" boolean DEFAULT false NOT NULL,
	CONSTRAINT "lead_submissions_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "lead_locale_chk" CHECK ("lead_submissions"."locale" in ('ar','en')),
	CONSTRAINT "lead_status_chk" CHECK ("lead_submissions"."status" in ('new','contacted','qualified','closed','spam')),
	CONSTRAINT "lead_intent_chk" CHECK ("lead_submissions"."intent" in ('general-interest','program-inquiry','trial-request','membership-consultation','preopening-updates')),
	CONSTRAINT "lead_mobile_chk" CHECK ("lead_submissions"."mobile_e164" ~ '^\+9665[0-9]{8}$'),
	CONSTRAINT "lead_name_len_chk" CHECK (char_length("lead_submissions"."adult_name") between 2 and 80),
	CONSTRAINT "lead_comment_len_chk" CHECK ("lead_submissions"."comment" is null or char_length("lead_submissions"."comment") <= 500)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"bucket" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_submission_id_lead_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."lead_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_submission_idx" ON "consent_events" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_unique_idx" ON "consent_events" USING btree ("submission_id","purpose");--> statement-breakpoint
CREATE INDEX "lead_created_idx" ON "lead_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_group_idx" ON "lead_submissions" USING btree ("group_key");--> statement-breakpoint
CREATE INDEX "rate_expires_idx" ON "rate_limits" USING btree ("expires_at");