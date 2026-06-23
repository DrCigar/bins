CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial" text,
	"model" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"product_line" text,
	"assembled_by" text,
	"notes" text,
	"location" text NOT NULL,
	"slot" integer,
	"destination" text,
	"checked_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "machines_serial_unique" UNIQUE("serial"),
	CONSTRAINT "machines_location_slot_unique" UNIQUE("location","slot")
);
--> statement-breakpoint
CREATE TABLE "serial_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"n" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serialization_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial" text NOT NULL,
	"product_line" text,
	"role" text NOT NULL,
	"model" text NOT NULL,
	"assembled_by" text,
	"serialized_at" timestamp with time zone DEFAULT now() NOT NULL
);
