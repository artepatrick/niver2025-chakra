create table public.music_suggestions (
  id uuid not null default extensions.uuid_generate_v4 (),
  presence_confirmation_id uuid not null,
  song_title character varying(255) not null,
  artist character varying(255) null,
  spotify_url character varying(512) null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  album_image_url character varying(512) null,
  preview_url character varying(512) null,
  duration_ms integer null,
  spotify_id character varying(255) null,
  album_name character varying(255) null,
  constraint music_suggestions_pkey primary key (id),
  constraint fk_music_suggestion_confirmation foreign KEY (presence_confirmation_id) references presence_confirmations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_music_suggestions_confirmation_id on public.music_suggestions using btree (presence_confirmation_id) TABLESPACE pg_default;

create trigger update_music_suggestions_updated_at BEFORE
update on music_suggestions for EACH row
execute FUNCTION update_updated_at_column ();