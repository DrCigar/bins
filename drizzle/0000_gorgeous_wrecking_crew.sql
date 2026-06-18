CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial" text,
	"model" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
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
