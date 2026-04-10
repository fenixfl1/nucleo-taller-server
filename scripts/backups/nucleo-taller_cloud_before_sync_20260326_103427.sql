--
-- PostgreSQL database dump
--

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: GOAL_PROGRESS_scope_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GOAL_PROGRESS_scope_enum" AS ENUM (
    'individual',
    'module'
);


--
-- Name: GOAL_scope_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GOAL_scope_enum" AS ENUM (
    'individual',
    'module'
);


--
-- Name: MENU_OPTION_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MENU_OPTION_type_enum" AS ENUM (
    'group',
    'divider',
    'link'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ACTION; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ACTION" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "ACTION_ID" integer NOT NULL,
    "NAME" character varying(255) NOT NULL,
    "DESCRIPTION" character varying(255),
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer
);


--
-- Name: ACTION_ACTION_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ACTION_ACTION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ACTION_ACTION_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ACTION_ACTION_ID_seq" OWNED BY public."ACTION"."ACTION_ID";


--
-- Name: ACTIVITY_LOG; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ACTIVITY_LOG" (
    "ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "ACTION" character varying(100) NOT NULL,
    "MODEL" character varying(150) NOT NULL,
    "OBJECT_ID" integer,
    "CHANGES" jsonb,
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ACTIVITY_LOG_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ACTIVITY_LOG_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ACTIVITY_LOG_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ACTIVITY_LOG_ID_seq" OWNED BY public."ACTIVITY_LOG"."ID";


--
-- Name: BUSINESS; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BUSINESS" (
    "BUSINESS_ID" integer NOT NULL,
    "NAME" character varying NOT NULL,
    "LOGO" bytea NOT NULL,
    "RNC" character varying NOT NULL,
    "PHONE" character varying NOT NULL,
    "ADDRESS" text NOT NULL,
    "STATE" character(1) NOT NULL
);


--
-- Name: DEPARTMENT; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DEPARTMENT" (
    "DEPARTMENT_ID" integer NOT NULL,
    "NAME" character varying(50) NOT NULL,
    "DESCRIPTION" character varying(100),
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL
);


--
-- Name: DEPARTMENT_DEPARTMENT_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DEPARTMENT_DEPARTMENT_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DEPARTMENT_DEPARTMENT_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DEPARTMENT_DEPARTMENT_ID_seq" OWNED BY public."DEPARTMENT"."DEPARTMENT_ID";


--
-- Name: GOAL; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GOAL" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer,
    "GOAL_ID" integer NOT NULL,
    "MODULE_ID" integer NOT NULL,
    "DESCRIPTION" character varying NOT NULL,
    "START_DATE" timestamp without time zone NOT NULL,
    "END_DATE" timestamp without time zone NOT NULL,
    "WEIGHT" integer NOT NULL,
    "SCOPE" public."GOAL_scope_enum" NOT NULL
);


--
-- Name: GOAL_GOAL_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GOAL_GOAL_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GOAL_GOAL_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GOAL_GOAL_ID_seq" OWNED BY public."GOAL"."GOAL_ID";


--
-- Name: GOAL_PROGRESS; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GOAL_PROGRESS" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer,
    "GOAL_PROGRESS_ID" integer NOT NULL,
    "GOAL_ID" integer NOT NULL,
    "SCOPE" public."GOAL_PROGRESS_scope_enum" NOT NULL,
    "PERIOD_ID" integer NOT NULL,
    "STAFF_ID" integer,
    "MODULE_ID" integer,
    "ACTUAL_VALUE" bigint NOT NULL
);


--
-- Name: GOAL_PROGRESS_GOAL_PROGRESS_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GOAL_PROGRESS_GOAL_PROGRESS_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GOAL_PROGRESS_GOAL_PROGRESS_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GOAL_PROGRESS_GOAL_PROGRESS_ID_seq" OWNED BY public."GOAL_PROGRESS"."GOAL_PROGRESS_ID";


--
-- Name: GOAL_X_MODULE; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GOAL_X_MODULE" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer,
    "GOAL_MODULE_ID" integer NOT NULL,
    "GOAL_ID" integer NOT NULL,
    "MODULE_ID" integer NOT NULL,
    "PERIOD_ID" integer,
    "TARGET_VALUE" bigint
);


--
-- Name: GOAL_X_MODULE_GOAL_MODULE_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GOAL_X_MODULE_GOAL_MODULE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GOAL_X_MODULE_GOAL_MODULE_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GOAL_X_MODULE_GOAL_MODULE_ID_seq" OWNED BY public."GOAL_X_MODULE"."GOAL_MODULE_ID";


--
-- Name: GOAL_X_STAFF; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GOAL_X_STAFF" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer,
    "GOAL_STAFF_ID" integer NOT NULL,
    "GOAL_ID" integer NOT NULL,
    "STAFF_ID" integer NOT NULL,
    "PERIOD_ID" integer NOT NULL,
    "TARGET_VALUE" bigint NOT NULL,
    "WEIGHT" numeric NOT NULL
);


--
-- Name: GOAL_X_STAFF_GOAL_STAFF_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GOAL_X_STAFF_GOAL_STAFF_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GOAL_X_STAFF_GOAL_STAFF_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GOAL_X_STAFF_GOAL_STAFF_ID_seq" OWNED BY public."GOAL_X_STAFF"."GOAL_STAFF_ID";


--
-- Name: MENU_OPTION; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MENU_OPTION" (
    "MENU_OPTION_ID" character varying(50) NOT NULL,
    "NAME" character varying(100) NOT NULL,
    "DESCRIPTION" character varying(250),
    "PATH" character varying(100),
    "ICON" text,
    "ORDER" integer NOT NULL,
    "PARENT_ID" character varying,
    "TYPE" public."MENU_OPTION_type_enum",
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL
);


--
-- Name: MENU_OPTIONS_X_ROLES; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MENU_OPTIONS_X_ROLES" (
    "MENU_OPTION_ID" character varying(50) NOT NULL,
    "ROLE_ID" integer NOT NULL
);


--
-- Name: MODULE; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MODULE" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "MODULE_ID" integer NOT NULL,
    "DESCRIPTION" character varying(150) NOT NULL,
    "SUPERVISOR_ID" integer NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer
);


--
-- Name: MODULE_MODULE_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MODULE_MODULE_ID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MODULE_MODULE_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MODULE_MODULE_ID_seq" OWNED BY public."MODULE"."MODULE_ID";


--
-- Name: PERMISSION; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PERMISSION" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "PERMISSION_ID" integer NOT NULL,
    "DESCRIPTION" character varying(255),
    "ACTION_ID" integer NOT NULL,
    "MENU_OPTION_ID" character varying,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer
);


--
-- Name: PERMISSION_PERMISSION_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PERMISSION_PERMISSION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PERMISSION_PERMISSION_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PERMISSION_PERMISSION_ID_seq" OWNED BY public."PERMISSION"."PERMISSION_ID";


--
-- Name: PERMISSION_X_ROLE; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PERMISSION_X_ROLE" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "PERMISSION_ID" integer NOT NULL,
    "ROLE_ID" integer NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer
);


--
-- Name: ROLE; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ROLE" (
    "ROLE_ID" integer NOT NULL,
    "NAME" character varying(30) NOT NULL,
    "DESCRIPTION" character varying(250) NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL
);


--
-- Name: ROLES_X_USER; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ROLES_X_USER" (
    "USER_ID" integer NOT NULL,
    "ROLE_ID" integer NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer,
    "ID" integer NOT NULL
);


--
-- Name: ROLES_X_USER_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ROLES_X_USER_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ROLES_X_USER_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ROLES_X_USER_ID_seq" OWNED BY public."ROLES_X_USER"."ID";


--
-- Name: ROLE_ROLE_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ROLE_ROLE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ROLE_ROLE_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ROLE_ROLE_ID_seq" OWNED BY public."ROLE"."ROLE_ID";


--
-- Name: ROLE_X_PERMISSION; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ROLE_X_PERMISSION" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "PERMISSION_ID" integer NOT NULL,
    "ROLE_ID" integer NOT NULL
);


--
-- Name: STAFF; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."STAFF" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "STAFF_ID" integer NOT NULL,
    "NAME" character varying NOT NULL,
    "LAST_NAME" character varying NOT NULL,
    "EMAIL" character varying NOT NULL,
    "BIRTH_DATA" date NOT NULL,
    "PHONE" character varying NOT NULL,
    "GENDER" character(1) NOT NULL,
    "IDENTITY_DOCUMENT" character varying(11) NOT NULL,
    "ADDRESS" text NOT NULL,
    "MODULE_ID" integer
);


--
-- Name: STAFF_STAFF_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."STAFF_STAFF_ID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: STAFF_STAFF_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."STAFF_STAFF_ID_seq" OWNED BY public."STAFF"."STAFF_ID";


--
-- Name: STAFF_X_MODULE; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."STAFF_X_MODULE" (
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "STAFF_MODULE_ID" integer NOT NULL,
    "STAFF_ID" integer NOT NULL,
    "MODULE_ID" integer NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT now(),
    "UPDATED_BY" integer
);


--
-- Name: STAFF_X_MODULE_STAFF_MODULE_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."STAFF_X_MODULE" ALTER COLUMN "STAFF_MODULE_ID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."STAFF_X_MODULE_STAFF_MODULE_ID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: USERS; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."USERS" (
    "USER_ID" integer NOT NULL,
    "USERNAME" character varying(25) NOT NULL,
    "PASSWORD" character varying NOT NULL,
    "LOGIN_COUNT" character varying,
    "LAST_LOGIN" timestamp without time zone,
    "CREATED_AT" timestamp without time zone DEFAULT now() NOT NULL,
    "CREATED_BY" integer,
    "STATE" character(1) DEFAULT 'A'::bpchar NOT NULL,
    "AVATAR" text,
    "MODULE_ID" integer,
    "STAFF_ID" integer NOT NULL,
    "IS_ACTIVE" boolean NOT NULL
);


--
-- Name: USERS_USER_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."USERS_USER_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: USERS_USER_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."USERS_USER_ID_seq" OWNED BY public."USERS"."USER_ID";


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: ACTION ACTION_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ACTION" ALTER COLUMN "ACTION_ID" SET DEFAULT nextval('public."ACTION_ACTION_ID_seq"'::regclass);


--
-- Name: ACTIVITY_LOG ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ACTIVITY_LOG" ALTER COLUMN "ID" SET DEFAULT nextval('public."ACTIVITY_LOG_ID_seq"'::regclass);


--
-- Name: DEPARTMENT DEPARTMENT_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DEPARTMENT" ALTER COLUMN "DEPARTMENT_ID" SET DEFAULT nextval('public."DEPARTMENT_DEPARTMENT_ID_seq"'::regclass);


--
-- Name: GOAL GOAL_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL" ALTER COLUMN "GOAL_ID" SET DEFAULT nextval('public."GOAL_GOAL_ID_seq"'::regclass);


--
-- Name: GOAL_PROGRESS GOAL_PROGRESS_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL_PROGRESS" ALTER COLUMN "GOAL_PROGRESS_ID" SET DEFAULT nextval('public."GOAL_PROGRESS_GOAL_PROGRESS_ID_seq"'::regclass);


--
-- Name: GOAL_X_MODULE GOAL_MODULE_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL_X_MODULE" ALTER COLUMN "GOAL_MODULE_ID" SET DEFAULT nextval('public."GOAL_X_MODULE_GOAL_MODULE_ID_seq"'::regclass);


--
-- Name: GOAL_X_STAFF GOAL_STAFF_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL_X_STAFF" ALTER COLUMN "GOAL_STAFF_ID" SET DEFAULT nextval('public."GOAL_X_STAFF_GOAL_STAFF_ID_seq"'::regclass);


--
-- Name: MODULE MODULE_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MODULE" ALTER COLUMN "MODULE_ID" SET DEFAULT nextval('public."MODULE_MODULE_ID_seq"'::regclass);


--
-- Name: PERMISSION PERMISSION_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION" ALTER COLUMN "PERMISSION_ID" SET DEFAULT nextval('public."PERMISSION_PERMISSION_ID_seq"'::regclass);


--
-- Name: ROLE ROLE_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE" ALTER COLUMN "ROLE_ID" SET DEFAULT nextval('public."ROLE_ROLE_ID_seq"'::regclass);


--
-- Name: ROLES_X_USER ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLES_X_USER" ALTER COLUMN "ID" SET DEFAULT nextval('public."ROLES_X_USER_ID_seq"'::regclass);


--
-- Name: STAFF STAFF_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF" ALTER COLUMN "STAFF_ID" SET DEFAULT nextval('public."STAFF_STAFF_ID_seq"'::regclass);


--
-- Name: USERS USER_ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."USERS" ALTER COLUMN "USER_ID" SET DEFAULT nextval('public."USERS_USER_ID_seq"'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: ACTION; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ACTION" ("CREATED_AT", "CREATED_BY", "STATE", "ACTION_ID", "NAME", "DESCRIPTION", "UPDATED_AT", "UPDATED_BY") FROM stdin;
2025-08-01 00:51:14.472359	1	A	1	view	Ver o listar registros	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	2	create	Crear nuevos registros	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	3	update	Actualizar registros existentes	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	4	delete	Eliminar registros	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	5	export	Exportar datos	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	6	approve	Aprobar operaciones o flujos	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	7	reject	Rechazar operaciones o flujos	2025-08-18 14:36:07.169651	\N
2025-08-01 00:51:14.472359	1	A	8	assign	Asignar recursos o roles	2025-08-18 14:36:07.169651	\N
\.


--
-- Data for Name: ACTIVITY_LOG; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ACTIVITY_LOG" ("ID", "USER_ID", "ACTION", "MODEL", "OBJECT_ID", "CHANGES", "CREATED_AT") FROM stdin;
2	1	INSERT	Staff	1	{"NAME": "María Altagracias", "EMAIL": "maltagraciam@gmail.com", "PHONE": "8495567878", "STATE": "A", "GENDER": "F", "ADDRESS": "n/a", "STAFF_ID": 5, "LAST_NAME": "Medina", "MODULE_ID": null, "BIRTH_DATA": "2001-05-14T04:00:00.000Z", "CREATED_AT": "2025-08-20T15:23:45.084Z", "CREATED_BY": 1, "IDENTITY_DOCUMENT": "40239785589"}	2025-08-20 15:23:48.375033
14	1	INSERT	User	8	{"STAFF": {"NAME": "Michael", "EMAIL": "mjackson@gmail.com", "PHONE": "8295597878", "STATE": "A", "GENDER": "M", "ADDRESS": "n/a", "STAFF_ID": 2, "LAST_NAME": "Jackson", "MODULE_ID": null, "BIRTH_DATA": "1996-08-13", "CREATED_AT": "2025-08-20T15:05:29.058Z", "CREATED_BY": 1, "IDENTITY_DOCUMENT": "40235979985"}, "STATE": "A", "AVATAR": null, "CREATOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "USER_ID": 8, "PASSWORD": "$2b$10$nnt3V7U/lnfBKjF7PgoLz.ce1J16icBlwvT06tICnHdSbNNyHe1Bq", "STAFF_ID": 2, "USERNAME": "mjackson", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T19:14:54.252Z", "CREATED_BY": 1, "LAST_LOGIN": null, "LOGIN_COUNT": null}	2025-08-20 19:14:56.451406
15	1	INSERT	UserRoles	\N	{"ROLE": {"NAME": "Supervisor", "STATE": "A", "ROLE_ID": 2, "CREATED_AT": "2025-08-01T16:00:42.657Z", "CREATED_BY": 1, "DESCRIPTION": "Rol para empleados que tiene resposabilidad de supervisar a otros"}, "USER": {"STAFF": {"NAME": "Michael", "EMAIL": "mjackson@gmail.com", "PHONE": "8295597878", "STATE": "A", "GENDER": "M", "ADDRESS": "n/a", "STAFF_ID": 2, "LAST_NAME": "Jackson", "MODULE_ID": null, "BIRTH_DATA": "1996-08-13", "CREATED_AT": "2025-08-20T15:05:29.058Z", "CREATED_BY": 1, "IDENTITY_DOCUMENT": "40235979985"}, "STATE": "A", "AVATAR": null, "CREATOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "USER_ID": 8, "PASSWORD": "$2b$10$nnt3V7U/lnfBKjF7PgoLz.ce1J16icBlwvT06tICnHdSbNNyHe1Bq", "STAFF_ID": 2, "USERNAME": "mjackson", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T19:14:54.252Z", "CREATED_BY": 1, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "STATE": "A", "ROLE_ID": 2, "USER_ID": 8, "CREATED_AT": "2025-08-20T19:14:54.454Z", "CREATED_BY": 1, "UPDATED_AT": "2025-08-20T23:14:56.451Z", "UPDATED_BY": null}	2025-08-20 19:14:56.451406
16	1	INSERT	User	9	{"STAFF": {"NAME": "Miguel", "EMAIL": "mmartes@gmail.com", "PHONE": "8495587878", "STATE": "A", "GENDER": "M", "ADDRESS": "n/a", "STAFF_ID": 3, "LAST_NAME": "Martes", "MODULE_ID": null, "BIRTH_DATA": "1995-06-17", "CREATED_AT": "2025-08-20T15:12:41.138Z", "CREATED_BY": 1, "IDENTITY_DOCUMENT": "04789898587"}, "STATE": "A", "AVATAR": null, "CREATOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "USER_ID": 9, "PASSWORD": "$2b$10$VROizWCuqSlh.62lGiEeauuC4lmUr9KrDvXCS3G99WmdQlgrYTXZe", "STAFF_ID": 3, "USERNAME": "mmarte", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T19:35:03.491Z", "CREATED_BY": 1, "LAST_LOGIN": null, "LOGIN_COUNT": null}	2025-08-20 19:35:05.644435
17	1	INSERT	UserRoles	3	{"ID": 3, "ROLE": {"NAME": "Coordinador", "STATE": "A", "ROLE_ID": 4, "CREATED_AT": "2025-08-02T00:21:52.134Z", "CREATED_BY": 1, "DESCRIPTION": "Coordina los equipos de trabajo y las metas"}, "USER": {"STAFF": {"NAME": "Miguel", "EMAIL": "mmartes@gmail.com", "PHONE": "8495587878", "STATE": "A", "GENDER": "M", "ADDRESS": "n/a", "STAFF_ID": 3, "LAST_NAME": "Martes", "MODULE_ID": null, "BIRTH_DATA": "1995-06-17", "CREATED_AT": "2025-08-20T15:12:41.138Z", "CREATED_BY": 1, "IDENTITY_DOCUMENT": "04789898587"}, "STATE": "A", "AVATAR": null, "CREATOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "USER_ID": 9, "PASSWORD": "$2b$10$VROizWCuqSlh.62lGiEeauuC4lmUr9KrDvXCS3G99WmdQlgrYTXZe", "STAFF_ID": 3, "USERNAME": "mmarte", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T19:35:03.491Z", "CREATED_BY": 1, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "STATE": "A", "ROLE_ID": 4, "USER_ID": 9, "CREATED_AT": "2025-08-20T19:35:03.717Z", "CREATED_BY": 1, "UPDATED_AT": "2025-08-20T23:35:05.644Z", "UPDATED_BY": null}	2025-08-20 19:35:05.644435
18	1	UPDATE	User	\N	{}	2025-08-20 19:36:04.625212
22	1	INSERT	Module	4	{"STATE": "A", "MODULE_ID": 4, "CREATED_AT": "2025-08-21T23:37:18.336Z", "CREATED_BY": 1, "SUPERVISOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "UPDATED_AT": "2025-08-22T03:37:23.584Z", "UPDATED_BY": null, "DESCRIPTION": "Producción de Camisetas deportivas", "SUPERVISOR_ID": 1}	2025-08-21 23:37:23.584791
23	1	INSERT	StaffModule	\N	{"STATE": "A", "MODULE": {"STATE": "A", "MODULE_ID": 4, "CREATED_AT": "2025-08-21T23:37:18.336Z", "CREATED_BY": 1, "SUPERVISOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "UPDATED_AT": "2025-08-22T03:37:23.584Z", "UPDATED_BY": null, "DESCRIPTION": "Producción de Camisetas deportivas", "SUPERVISOR_ID": 1}, "STAFF_ID": 4, "MODULE_ID": 4, "CREATED_AT": "2025-08-21T23:37:18.475Z", "CREATED_BY": 1, "UPDATED_AT": "2025-08-22T03:37:23.584Z", "UPDATED_BY": null}	2025-08-21 23:37:23.584791
24	1	INSERT	StaffModule	\N	{"STATE": "A", "MODULE": {"STATE": "A", "MODULE_ID": 4, "CREATED_AT": "2025-08-21T23:37:18.336Z", "CREATED_BY": 1, "SUPERVISOR": {"STATE": "A", "AVATAR": "https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg", "USER_ID": 1, "STAFF_ID": 1, "USERNAME": "admin", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T12:44:20.000Z", "CREATED_BY": null, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "UPDATED_AT": "2025-08-22T03:37:23.584Z", "UPDATED_BY": null, "DESCRIPTION": "Producción de Camisetas deportivas", "SUPERVISOR_ID": 1}, "STAFF_ID": 5, "MODULE_ID": 4, "CREATED_AT": "2025-08-21T23:37:18.475Z", "CREATED_BY": 1, "UPDATED_AT": "2025-08-22T03:37:23.584Z", "UPDATED_BY": null}	2025-08-21 23:37:23.584791
25	1	INSERT	Module	5	{"STATE": "A", "MODULE_ID": 5, "CREATED_AT": "2025-08-24T02:18:54.933Z", "CREATED_BY": 1, "SUPERVISOR": {"STATE": "A", "AVATAR": null, "USER_ID": 8, "STAFF_ID": 2, "USERNAME": "mjackson", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T19:14:54.252Z", "CREATED_BY": 1, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "UPDATED_AT": "2025-08-24T06:18:55.620Z", "UPDATED_BY": null, "DESCRIPTION": "Producción de Camisetas", "SUPERVISOR_ID": 8}	2025-08-24 02:18:55.620909
26	1	INSERT	StaffModule	\N	{"STATE": "A", "MODULE": {"STATE": "A", "MODULE_ID": 5, "CREATED_AT": "2025-08-24T02:18:54.933Z", "CREATED_BY": 1, "SUPERVISOR": {"STATE": "A", "AVATAR": null, "USER_ID": 8, "STAFF_ID": 2, "USERNAME": "mjackson", "IS_ACTIVE": true, "MODULE_ID": null, "CREATED_AT": "2025-08-20T19:14:54.252Z", "CREATED_BY": 1, "LAST_LOGIN": null, "LOGIN_COUNT": null}, "UPDATED_AT": "2025-08-24T06:18:55.620Z", "UPDATED_BY": null, "DESCRIPTION": "Producción de Camisetas", "SUPERVISOR_ID": 8}, "STAFF_ID": 4, "MODULE_ID": 5, "CREATED_AT": "2025-08-24T02:18:55.095Z", "CREATED_BY": 1, "UPDATED_AT": "2025-08-24T06:18:55.620Z", "UPDATED_BY": null}	2025-08-24 02:18:55.620909
27	1	INSERT	Goal	1	{"SCOPE": "module", "STATE": "A", "WEIGHT": 10, "GOAL_ID": 1, "END_DATE": "2025-09-07T03:59:59.999Z", "MODULE_ID": 4, "CREATED_AT": "2025-09-03T13:53:34.009Z", "CREATED_BY": 1, "START_DATE": "2025-09-01T04:00:00.000Z", "UPDATED_AT": "2025-09-03T17:53:43.240Z", "UPDATED_BY": null, "DESCRIPTION": "Aumentar producción de Calzado "}	2025-09-03 13:53:43.240066
28	1	INSERT	GoalModule	1	{"STATE": "A", "GOAL_ID": 1, "MODULE_ID": 4, "PERIOD_ID": 202501, "CREATED_AT": "2025-09-03T14:06:21.471Z", "CREATED_BY": 1, "UPDATED_AT": "2025-09-03T18:06:30.156Z", "UPDATED_BY": null, "TARGET_VALUE": 500, "GOAL_MODULE_ID": 1}	2025-09-03 14:06:30.156965
29	1	INSERT	Goal	2	{"SCOPE": "module", "STATE": "A", "WEIGHT": 10, "GOAL_ID": 2, "END_DATE": "2025-09-07T03:59:59.999Z", "MODULE_ID": 4, "CREATED_AT": "2025-09-03T21:06:34.476Z", "CREATED_BY": 1, "START_DATE": "2025-09-01T04:00:00.000Z", "UPDATED_AT": "2025-09-04T01:06:43.119Z", "UPDATED_BY": null, "DESCRIPTION": "Producción 500 unidades de zapatillas"}	2025-09-03 21:06:43.119352
\.


--
-- Data for Name: BUSINESS; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BUSINESS" ("BUSINESS_ID", "NAME", "LOGO", "RNC", "PHONE", "ADDRESS", "STATE") FROM stdin;
\.


--
-- Data for Name: DEPARTMENT; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DEPARTMENT" ("DEPARTMENT_ID", "NAME", "DESCRIPTION", "CREATED_AT", "CREATED_BY", "STATE") FROM stdin;
\.


--
-- Data for Name: GOAL; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GOAL" ("CREATED_AT", "CREATED_BY", "STATE", "UPDATED_AT", "UPDATED_BY", "GOAL_ID", "MODULE_ID", "DESCRIPTION", "START_DATE", "END_DATE", "WEIGHT", "SCOPE") FROM stdin;
2025-09-03 09:53:34.009	1	A	2025-09-03 13:53:43.240066	\N	1	4	Aumentar producción de Calzado 	2025-09-01 00:00:00	2025-09-06 23:59:59.999	10	module
2025-09-03 17:06:34.476	1	A	2025-09-03 21:06:43.119352	\N	2	4	Producción 500 unidades de zapatillas	2025-09-01 00:00:00	2025-09-06 23:59:59.999	10	module
\.


--
-- Data for Name: GOAL_PROGRESS; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GOAL_PROGRESS" ("CREATED_AT", "CREATED_BY", "STATE", "UPDATED_AT", "UPDATED_BY", "GOAL_PROGRESS_ID", "GOAL_ID", "SCOPE", "PERIOD_ID", "STAFF_ID", "MODULE_ID", "ACTUAL_VALUE") FROM stdin;
\.


--
-- Data for Name: GOAL_X_MODULE; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GOAL_X_MODULE" ("CREATED_AT", "CREATED_BY", "STATE", "UPDATED_AT", "UPDATED_BY", "GOAL_MODULE_ID", "GOAL_ID", "MODULE_ID", "PERIOD_ID", "TARGET_VALUE") FROM stdin;
2025-09-03 10:06:21.471	1	A	2025-09-03 14:06:30.156965	\N	1	1	4	202501	500
\.


--
-- Data for Name: GOAL_X_STAFF; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GOAL_X_STAFF" ("CREATED_AT", "CREATED_BY", "STATE", "UPDATED_AT", "UPDATED_BY", "GOAL_STAFF_ID", "GOAL_ID", "STAFF_ID", "PERIOD_ID", "TARGET_VALUE", "WEIGHT") FROM stdin;
\.


--
-- Data for Name: MENU_OPTION; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MENU_OPTION" ("MENU_OPTION_ID", "NAME", "DESCRIPTION", "PATH", "ICON", "ORDER", "PARENT_ID", "TYPE", "CREATED_AT", "CREATED_BY", "STATE") FROM stdin;
0-2	Gestión de usuarios	Administración de usuarios y roles	\N	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-cog-icon lucide-user-round-cog"><path d="m14.305 19.53.923-.382"/><path d="m15.228 16.852-.923-.383"/><path d="m16.852 15.228-.383-.923"/><path d="m16.852 20.772-.383.924"/><path d="m19.148 15.228.383-.923"/><path d="m19.53 21.696-.382-.924"/><path d="M2 21a8 8 0 0 1 10.434-7.62"/><path d="m20.772 16.852.924-.383"/><path d="m20.772 19.148.924.383"/><circle cx="10" cy="8" r="5"/><circle cx="18" cy="18" r="3"/></svg>	2	\N	group	2025-07-31 19:51:24.800755	\N	A
0-2-1	Roles	Listado de roles	/0-2-1/roles	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-shield-lock" viewBox="0 0 16 16">\n  <path d="M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .101.025 1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56"/>\n  <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415"/>\n</svg>	4	\N	\N	2025-07-31 19:51:24.800755	\N	A
0-2-2	Usuarios	Listado de usuarios	/0-2-2/users	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">\n  <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>\n</svg>	3	\N	\N	2025-07-31 19:51:24.800755	\N	A
0-4	Gestion de empleados	-----	\N	\N	4	\N	group	2025-07-31 19:51:24.800755	\N	A
0-1	Dashboard	Vista principal del sistema	/0-1/dashboard	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-speedometer2" viewBox="0 0 16 16">\n  <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4M3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707M2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.39.39 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.39.39 0 0 0-.029-.518z"/>\n  <path fill-rule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A8 8 0 0 1 0 10m8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3"/>\n</svg>	1	\N	\N	2025-07-31 19:51:24.800755	\N	A
0-5	Gestion de Empleados	Listado de empleados	\N	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-contact-round-icon lucide-contact-round"><path d="M16 2v2"/><path d="M17.915 22a6 6 0 0 0-12 0"/><path d="M8 2v2"/><circle cx="12" cy="12" r="4"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>	4	\N	\N	2025-07-31 19:51:24.800755	\N	I
0-5-2	Evaluaciones	Evaluación de empleados	/0-5-2/evaluation	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-rolodex" viewBox="0 0 16 16">\n  <path d="M8 9.05a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>\n  <path d="M1 1a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h.5a.5.5 0 0 0 .5-.5.5.5 0 0 1 1 0 .5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5.5.5 0 0 1 1 0 .5.5 0 0 0 .5.5h.5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H6.707L6 1.293A1 1 0 0 0 5.293 1zm0 1h4.293L6 2.707A1 1 0 0 0 6.707 3H15v10h-.085a1.5 1.5 0 0 0-2.4-.63C11.885 11.223 10.554 10 8 10c-2.555 0-3.886 1.224-4.514 2.37a1.5 1.5 0 0 0-2.4.63H1z"/>\n</svg>	6	\N	\N	2025-07-31 19:51:24.800755	\N	A
0-5-4	Metas	Metas por equipos	/0-5-4/goals	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-data" viewBox="0 0 16 16">\n  <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0z"/>\n  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>\n  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>\n</svg>	8	\N	\N	2025-07-31 19:51:24.800755	\N	A
0-5-1	Empleados	Lista de empleados	/0-5-1/employees	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-bounding-box" viewBox="0 0 16 16">\n  <path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-1 0v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1zM11 .5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 1-.5-.5M.5 11a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5"/>\n  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>\n</svg>	5	\N	\N	2025-07-31 19:51:24.800755	\N	A
0-5-3	Modulos	Equipos de trabajo	/0-5-3/modules	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-add" viewBox="0 0 16 16">\n  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>\n  <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>\n</svg>	7	\N	\N	2025-07-31 19:51:24.800755	\N	A
\.


--
-- Data for Name: MENU_OPTIONS_X_ROLES; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID") FROM stdin;
0-2	1
0-2-1	1
0-2-2	1
0-4	1
0-1	1
0-5-2	1
0-5-4	1
0-5-1	1
0-5-3	1
\.


--
-- Data for Name: MODULE; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MODULE" ("CREATED_AT", "CREATED_BY", "STATE", "MODULE_ID", "DESCRIPTION", "SUPERVISOR_ID", "UPDATED_AT", "UPDATED_BY") FROM stdin;
2025-08-21 19:37:18.336	1	A	4	Producción de Camisetas deportivas	1	2025-08-21 23:37:23.584791	\N
2025-08-23 22:18:54.933	1	A	5	Producción de Camisetas	8	2025-08-24 02:18:55.620909	\N
\.


--
-- Data for Name: PERMISSION; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PERMISSION" ("CREATED_AT", "CREATED_BY", "STATE", "PERMISSION_ID", "DESCRIPTION", "ACTION_ID", "MENU_OPTION_ID", "UPDATED_AT", "UPDATED_BY") FROM stdin;
2025-08-01 11:09:22	8	A	5	VIEW	1	\N	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	101	Ver roles	1	0-2-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	102	Crear roles	2	0-2-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	103	Editar roles	3	0-2-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	104	Eliminar roles	4	0-2-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	105	Ver usuarios	1	0-2-2	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	106	Crear usuarios	2	0-2-2	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	107	Editar usuarios	3	0-2-2	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	108	Eliminar usuarios	4	0-2-2	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	109	Ver empleados	1	0-4	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	110	Crear empleados	2	0-5-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	111	Editar empleados	3	0-5-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	112	Eliminar empleados	4	0-5-1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	113	Ver evaluaciones	1	0-5-2	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	114	Ver equipos	1	0-5-3	2025-08-18 14:36:07.169651	\N
2025-08-01 00:56:07.994447	8	A	115	Ver metas	1	0-5-4	2025-08-18 14:36:07.169651	\N
2025-08-01 11:06:22	8	A	1	ver	1	0-1	2025-08-18 14:36:07.169651	\N
2025-08-01 11:08:00	8	A	2	VIEW	1	0-5	2025-08-18 14:36:07.169651	\N
2025-08-01 11:08:54	8	A	4	VIEW	1	0-2	2025-08-18 14:36:07.169651	\N
\.


--
-- Data for Name: PERMISSION_X_ROLE; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PERMISSION_X_ROLE" ("CREATED_AT", "CREATED_BY", "STATE", "PERMISSION_ID", "ROLE_ID", "UPDATED_AT", "UPDATED_BY") FROM stdin;
2025-08-01 00:57:50.474694	1	A	101	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	102	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	103	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	104	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	105	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	106	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	107	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	108	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	109	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	110	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	111	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	112	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	113	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	114	1	2025-08-18 14:36:07.169651	\N
2025-08-01 00:57:50.474694	1	A	115	1	2025-08-18 14:36:07.169651	\N
2025-08-01 11:10:11	1	A	1	1	2025-08-18 14:36:07.169651	\N
2025-08-01 11:10:26	1	A	2	1	2025-08-18 14:36:07.169651	\N
2025-08-01 11:10:35	1	A	4	1	2025-08-18 14:36:07.169651	\N
2025-08-01 11:11:10	1	A	5	1	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	101	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	102	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	103	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	104	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	105	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	106	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	107	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	108	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	109	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	110	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	111	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	112	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	113	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	114	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	115	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	1	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	2	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	4	2	2025-08-18 14:36:07.169651	\N
2025-08-01 12:00:42.657	1	A	5	2	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	109	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	110	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	111	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	112	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	113	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	114	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	115	4	2025-08-18 14:36:07.169651	\N
2025-08-01 20:21:52.134	1	A	1	4	2025-08-18 14:36:07.169651	\N
\.


--
-- Data for Name: ROLE; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ROLE" ("ROLE_ID", "NAME", "DESCRIPTION", "CREATED_AT", "CREATED_BY", "STATE") FROM stdin;
1	Admin	Rol de administradr	2025-07-31 19:50:37.343746	1	A
2	Supervisor	Rol para empleados que tiene resposabilidad de supervisar a otros	2025-08-01 12:00:42.657	1	A
4	Coordinador	Coordina los equipos de trabajo y las metas	2025-08-01 20:21:52.134	1	A
\.


--
-- Data for Name: ROLES_X_USER; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ROLES_X_USER" ("USER_ID", "ROLE_ID", "CREATED_AT", "CREATED_BY", "STATE", "UPDATED_AT", "UPDATED_BY", "ID") FROM stdin;
1	1	2025-08-20 19:34:27.133815	\N	A	2025-08-20 19:34:27.133815	\N	1
8	2	2025-08-20 19:34:27.133815	\N	A	2025-08-20 19:34:27.133815	\N	2
9	4	2025-08-20 15:35:03.717	1	A	2025-08-20 19:35:05.644435	\N	3
\.


--
-- Data for Name: ROLE_X_PERMISSION; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ROLE_X_PERMISSION" ("CREATED_AT", "CREATED_BY", "STATE", "PERMISSION_ID", "ROLE_ID") FROM stdin;
\.


--
-- Data for Name: STAFF; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."STAFF" ("CREATED_AT", "CREATED_BY", "STATE", "STAFF_ID", "NAME", "LAST_NAME", "EMAIL", "BIRTH_DATA", "PHONE", "GENDER", "IDENTITY_DOCUMENT", "ADDRESS", "MODULE_ID") FROM stdin;
2025-07-17 08:16:53.374	1	A	1	Juan	Pérez	juan.perez@example.com	1990-05-19	8091234567	M	00123456789	Calle 10, Santo Domingo, RD	\N
2025-08-20 11:05:29.058	1	A	2	Michael	Jackson	mjackson@gmail.com	1996-08-13	8295597878	M	40235979985	n/a	\N
2025-08-20 11:12:41.138	1	A	3	Miguel	Martes	mmartes@gmail.com	1995-06-17	8495587878	M	04789898587	n/a	\N
2025-08-20 11:16:38.067	1	A	4	Marlon	Medina	mmedina@gmail.com	2000-02-12	8497785658	M	40236789965	n/a	\N
2025-08-20 11:23:45.084	1	A	5	María Altagracias	Medina	maltagraciam@gmail.com	2001-05-14	8495567878	F	40239785589	n/a	\N
\.


--
-- Data for Name: STAFF_X_MODULE; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."STAFF_X_MODULE" ("CREATED_AT", "CREATED_BY", "STATE", "STAFF_MODULE_ID", "STAFF_ID", "MODULE_ID", "UPDATED_AT", "UPDATED_BY") FROM stdin;
2025-08-21 19:37:18.475	1	A	1	4	4	2025-08-21 23:37:23.584791	\N
2025-08-21 19:37:18.475	1	A	2	5	4	2025-08-21 23:37:23.584791	\N
2025-08-23 22:18:55.095	1	A	3	4	5	2025-08-24 02:18:55.620909	\N
\.


--
-- Data for Name: USERS; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."USERS" ("USER_ID", "USERNAME", "PASSWORD", "LOGIN_COUNT", "LAST_LOGIN", "CREATED_AT", "CREATED_BY", "STATE", "AVATAR", "MODULE_ID", "STAFF_ID", "IS_ACTIVE") FROM stdin;
1	admin	$2a$12$atIDCxn/e5bcWkiaHS2X9eCiLiieJurleSSgj5mrYxNMelKifKUHO	\N	\N	2025-08-20 08:44:20	\N	A	https://i.pinimg.com/originals/bc/0a/c1/bc0ac1ee347b750bc0a710ab342fd550.jpg	\N	1	t
8	mjackson	$2b$10$nnt3V7U/lnfBKjF7PgoLz.ce1J16icBlwvT06tICnHdSbNNyHe1Bq	\N	\N	2025-08-20 15:14:54.252	1	A	\N	\N	2	t
9	mmarte	$2b$10$VROizWCuqSlh.62lGiEeauuC4lmUr9KrDvXCS3G99WmdQlgrYTXZe	\N	\N	2025-08-20 15:35:03.491	1	I	\N	\N	3	t
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1752662128871	PostRefactoring1752662128871
2	1752662474818	Migration1752662474818
3	1752662589994	Migration1752662589994
4	1752662811596	Migration1752662811596
5	1752662879313	Migration1752662879313
6	1752663355604	Migration1752663355604
7	1752712403947	Migration1752712403947
8	1752713181923	Migration1752713181923
9	1752750020987	Migration1752750020987
10	1752765601639	Migration1752765601639
11	1752765707976	Migration1752765707976
12	1753064203213	Migration1753064203213
13	1754004212601	Migration1754004212601
14	1754004439077	Migration1754004439077
15	1754004765834	Migration1754004765834
16	1754005667936	Migration1754005667936
17	1754005808933	Migration1754005808933
18	1754005855770	Migration1754005855770
19	1755447069430	Migration1755447069430
20	1755447811563	Migration1755447811563
21	1755447926691	Migration1755447926691
22	1755542142052	Migration1755542142052
23	1755542231311	Migration1755542231311
24	1755545746159	Migration1755545746159
25	1755550928961	Migration1755550928961
26	1755617151613	Migration1755617151613
27	1755692986635	Migration1755692986635
28	1755715129847	Migration1755715129847
29	1755717769967	Migration1755717769967
30	1756074763538	Migration1756074763538
31	1756908155907	Migration1756908155907
\.


--
-- Name: ACTION_ACTION_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ACTION_ACTION_ID_seq"', 1, false);


--
-- Name: ACTIVITY_LOG_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ACTIVITY_LOG_ID_seq"', 29, true);


--
-- Name: DEPARTMENT_DEPARTMENT_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DEPARTMENT_DEPARTMENT_ID_seq"', 1, false);


--
-- Name: GOAL_GOAL_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GOAL_GOAL_ID_seq"', 2, true);


--
-- Name: GOAL_PROGRESS_GOAL_PROGRESS_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GOAL_PROGRESS_GOAL_PROGRESS_ID_seq"', 1, false);


--
-- Name: GOAL_X_MODULE_GOAL_MODULE_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GOAL_X_MODULE_GOAL_MODULE_ID_seq"', 1, true);


--
-- Name: GOAL_X_STAFF_GOAL_STAFF_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GOAL_X_STAFF_GOAL_STAFF_ID_seq"', 1, false);


--
-- Name: MODULE_MODULE_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MODULE_MODULE_ID_seq"', 5, true);


--
-- Name: PERMISSION_PERMISSION_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PERMISSION_PERMISSION_ID_seq"', 1, false);


--
-- Name: ROLES_X_USER_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ROLES_X_USER_ID_seq"', 3, true);


--
-- Name: ROLE_ROLE_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ROLE_ROLE_ID_seq"', 1, false);


--
-- Name: STAFF_STAFF_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."STAFF_STAFF_ID_seq"', 5, true);


--
-- Name: STAFF_X_MODULE_STAFF_MODULE_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."STAFF_X_MODULE_STAFF_MODULE_ID_seq"', 3, true);


--
-- Name: USERS_USER_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."USERS_USER_ID_seq"', 9, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 31, true);


--
-- Name: ROLE_X_PERMISSION PK_1daeb68c929a23440933008dcd0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE_X_PERMISSION"
    ADD CONSTRAINT "PK_1daeb68c929a23440933008dcd0" PRIMARY KEY ("PERMISSION_ID", "ROLE_ID");


--
-- Name: MENU_OPTIONS_X_ROLES PK_1f6674a97c67f5297c5d3b5997f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MENU_OPTIONS_X_ROLES"
    ADD CONSTRAINT "PK_1f6674a97c67f5297c5d3b5997f" PRIMARY KEY ("MENU_OPTION_ID", "ROLE_ID");


--
-- Name: ROLE PK_2464e6137ccbd5f89724b83282e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE"
    ADD CONSTRAINT "PK_2464e6137ccbd5f89724b83282e" PRIMARY KEY ("ROLE_ID");


--
-- Name: GOAL PK_31918bd1daf1306b0e32a329ea7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL"
    ADD CONSTRAINT "PK_31918bd1daf1306b0e32a329ea7" PRIMARY KEY ("GOAL_ID");


--
-- Name: STAFF_X_MODULE PK_3f3e5ba18b672be054f6ca21f71; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF_X_MODULE"
    ADD CONSTRAINT "PK_3f3e5ba18b672be054f6ca21f71" PRIMARY KEY ("STAFF_MODULE_ID");


--
-- Name: MODULE PK_4d733a2e60db181ead5029c4f2a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MODULE"
    ADD CONSTRAINT "PK_4d733a2e60db181ead5029c4f2a" PRIMARY KEY ("MODULE_ID");


--
-- Name: GOAL_PROGRESS PK_550d2158f7acf25e165c397006d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL_PROGRESS"
    ADD CONSTRAINT "PK_550d2158f7acf25e165c397006d" PRIMARY KEY ("GOAL_PROGRESS_ID");


--
-- Name: ACTIVITY_LOG PK_68a56a34c121833ade7ce683435; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ACTIVITY_LOG"
    ADD CONSTRAINT "PK_68a56a34c121833ade7ce683435" PRIMARY KEY ("ID");


--
-- Name: PERMISSION PK_7efad0105d237300cbd89505d3d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION"
    ADD CONSTRAINT "PK_7efad0105d237300cbd89505d3d" PRIMARY KEY ("PERMISSION_ID");


--
-- Name: GOAL_X_MODULE PK_80938948bdeeb8114e9350501a0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL_X_MODULE"
    ADD CONSTRAINT "PK_80938948bdeeb8114e9350501a0" PRIMARY KEY ("GOAL_MODULE_ID");


--
-- Name: BUSINESS PK_8726e67e668478ef7d1aedd6a0e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BUSINESS"
    ADD CONSTRAINT "PK_8726e67e668478ef7d1aedd6a0e" PRIMARY KEY ("BUSINESS_ID");


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: STAFF PK_9d3026d6816040c56533cfd122e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF"
    ADD CONSTRAINT "PK_9d3026d6816040c56533cfd122e" PRIMARY KEY ("STAFF_ID");


--
-- Name: GOAL_X_STAFF PK_a638fb438a78ca2e89d17326205; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GOAL_X_STAFF"
    ADD CONSTRAINT "PK_a638fb438a78ca2e89d17326205" PRIMARY KEY ("GOAL_STAFF_ID");


--
-- Name: PERMISSION_X_ROLE PK_aba3c897a024c6ba7edf7a47da3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION_X_ROLE"
    ADD CONSTRAINT "PK_aba3c897a024c6ba7edf7a47da3" PRIMARY KEY ("PERMISSION_ID", "ROLE_ID");


--
-- Name: DEPARTMENT PK_b3142394ad5073f4a21ef3df9c4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DEPARTMENT"
    ADD CONSTRAINT "PK_b3142394ad5073f4a21ef3df9c4" PRIMARY KEY ("DEPARTMENT_ID");


--
-- Name: MENU_OPTION PK_c33923d6f156b267e8e4dfe59c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MENU_OPTION"
    ADD CONSTRAINT "PK_c33923d6f156b267e8e4dfe59c3" PRIMARY KEY ("MENU_OPTION_ID");


--
-- Name: ACTION PK_dfc4a3ad12020abd40ef5d092ac; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ACTION"
    ADD CONSTRAINT "PK_dfc4a3ad12020abd40ef5d092ac" PRIMARY KEY ("ACTION_ID");


--
-- Name: USERS PK_f37d934f4f6abb757dce91ce6f2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."USERS"
    ADD CONSTRAINT "PK_f37d934f4f6abb757dce91ce6f2" PRIMARY KEY ("USER_ID");


--
-- Name: ROLE UQ_cfcd3a13b39580bf95cd2ef1b1f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE"
    ADD CONSTRAINT "UQ_cfcd3a13b39580bf95cd2ef1b1f" UNIQUE ("NAME");


--
-- Name: IDX_2c7ac3fef525331bd30141dafb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2c7ac3fef525331bd30141dafb" ON public."MENU_OPTIONS_X_ROLES" USING btree ("ROLE_ID");


--
-- Name: IDX_d3bd9bead05f4d2521b2ffe1a8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d3bd9bead05f4d2521b2ffe1a8" ON public."MENU_OPTIONS_X_ROLES" USING btree ("MENU_OPTION_ID");


--
-- Name: MENU_OPTION FK_19bed68461b29c412f1aa9a9cfe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MENU_OPTION"
    ADD CONSTRAINT "FK_19bed68461b29c412f1aa9a9cfe" FOREIGN KEY ("CREATED_BY") REFERENCES public."USERS"("USER_ID");


--
-- Name: USERS FK_1b85e2063e5a2fd607568dbe803; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."USERS"
    ADD CONSTRAINT "FK_1b85e2063e5a2fd607568dbe803" FOREIGN KEY ("MODULE_ID") REFERENCES public."MODULE"("MODULE_ID");


--
-- Name: MENU_OPTION FK_1f20d78a9ea67f0564538ea95f7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MENU_OPTION"
    ADD CONSTRAINT "FK_1f20d78a9ea67f0564538ea95f7" FOREIGN KEY ("PARENT_ID") REFERENCES public."MENU_OPTION"("MENU_OPTION_ID");


--
-- Name: ACTIVITY_LOG FK_22655a7b2a103dec25107c5d076; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ACTIVITY_LOG"
    ADD CONSTRAINT "FK_22655a7b2a103dec25107c5d076" FOREIGN KEY ("USER_ID") REFERENCES public."USERS"("USER_ID");


--
-- Name: PERMISSION_X_ROLE FK_24cb3d11068904d9544b5add23b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION_X_ROLE"
    ADD CONSTRAINT "FK_24cb3d11068904d9544b5add23b" FOREIGN KEY ("PERMISSION_ID") REFERENCES public."PERMISSION"("PERMISSION_ID");


--
-- Name: MENU_OPTIONS_X_ROLES FK_2c7ac3fef525331bd30141dafb7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MENU_OPTIONS_X_ROLES"
    ADD CONSTRAINT "FK_2c7ac3fef525331bd30141dafb7" FOREIGN KEY ("ROLE_ID") REFERENCES public."ROLE"("ROLE_ID");


--
-- Name: PERMISSION FK_3c9b3cee370052f5bba1d4805af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION"
    ADD CONSTRAINT "FK_3c9b3cee370052f5bba1d4805af" FOREIGN KEY ("MENU_OPTION_ID") REFERENCES public."MENU_OPTION"("MENU_OPTION_ID");


--
-- Name: PERMISSION FK_3e0bac09494fb052114349b2a62; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION"
    ADD CONSTRAINT "FK_3e0bac09494fb052114349b2a62" FOREIGN KEY ("ACTION_ID") REFERENCES public."ACTION"("ACTION_ID");


--
-- Name: ROLES_X_USER FK_6014c0ac471a029270386464b0e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLES_X_USER"
    ADD CONSTRAINT "FK_6014c0ac471a029270386464b0e" FOREIGN KEY ("USER_ID") REFERENCES public."USERS"("USER_ID");


--
-- Name: STAFF FK_6959a222385d4145719ceb62226; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF"
    ADD CONSTRAINT "FK_6959a222385d4145719ceb62226" FOREIGN KEY ("CREATED_BY") REFERENCES public."USERS"("USER_ID");


--
-- Name: ROLE_X_PERMISSION FK_7a73adef6a37de3385f3c262dce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE_X_PERMISSION"
    ADD CONSTRAINT "FK_7a73adef6a37de3385f3c262dce" FOREIGN KEY ("PERMISSION_ID") REFERENCES public."PERMISSION"("PERMISSION_ID");


--
-- Name: MODULE FK_8b35e265973ca359f88acc0003a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MODULE"
    ADD CONSTRAINT "FK_8b35e265973ca359f88acc0003a" FOREIGN KEY ("SUPERVISOR_ID") REFERENCES public."USERS"("USER_ID");


--
-- Name: DEPARTMENT FK_acec9f72e1346671835b0b5ecb7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DEPARTMENT"
    ADD CONSTRAINT "FK_acec9f72e1346671835b0b5ecb7" FOREIGN KEY ("CREATED_BY") REFERENCES public."USERS"("USER_ID");


--
-- Name: PERMISSION_X_ROLE FK_ae267066b6f7555d2adb197c85a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PERMISSION_X_ROLE"
    ADD CONSTRAINT "FK_ae267066b6f7555d2adb197c85a" FOREIGN KEY ("ROLE_ID") REFERENCES public."ROLE"("ROLE_ID");


--
-- Name: ROLE_X_PERMISSION FK_b58460781260bd2b802546df081; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE_X_PERMISSION"
    ADD CONSTRAINT "FK_b58460781260bd2b802546df081" FOREIGN KEY ("ROLE_ID") REFERENCES public."ROLE"("ROLE_ID");


--
-- Name: USERS FK_c477bdfa53cec3db27eb50458f8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."USERS"
    ADD CONSTRAINT "FK_c477bdfa53cec3db27eb50458f8" FOREIGN KEY ("STAFF_ID") REFERENCES public."STAFF"("STAFF_ID");


--
-- Name: STAFF_X_MODULE FK_c7df3e8d6f2a40ba46084c64c39; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF_X_MODULE"
    ADD CONSTRAINT "FK_c7df3e8d6f2a40ba46084c64c39" FOREIGN KEY ("STAFF_ID") REFERENCES public."STAFF"("STAFF_ID");


--
-- Name: ROLES_X_USER FK_cfb5ba942f33086e54cec026244; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLES_X_USER"
    ADD CONSTRAINT "FK_cfb5ba942f33086e54cec026244" FOREIGN KEY ("ROLE_ID") REFERENCES public."ROLE"("ROLE_ID");


--
-- Name: STAFF FK_d11fbcc2e9a1b168e05a1251c2e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF"
    ADD CONSTRAINT "FK_d11fbcc2e9a1b168e05a1251c2e" FOREIGN KEY ("MODULE_ID") REFERENCES public."MODULE"("MODULE_ID");


--
-- Name: STAFF_X_MODULE FK_d24accafdc1ea2253b404678408; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."STAFF_X_MODULE"
    ADD CONSTRAINT "FK_d24accafdc1ea2253b404678408" FOREIGN KEY ("MODULE_ID") REFERENCES public."MODULE"("MODULE_ID");


--
-- Name: MENU_OPTIONS_X_ROLES FK_d3bd9bead05f4d2521b2ffe1a88; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MENU_OPTIONS_X_ROLES"
    ADD CONSTRAINT "FK_d3bd9bead05f4d2521b2ffe1a88" FOREIGN KEY ("MENU_OPTION_ID") REFERENCES public."MENU_OPTION"("MENU_OPTION_ID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ROLE_X_PERMISSION FK_efb2dfed9dad6cb277a5897e010; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE_X_PERMISSION"
    ADD CONSTRAINT "FK_efb2dfed9dad6cb277a5897e010" FOREIGN KEY ("CREATED_BY") REFERENCES public."USERS"("USER_ID");


--
-- Name: USERS FK_f6c2423fd7a3b24eae6c372cc57; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."USERS"
    ADD CONSTRAINT "FK_f6c2423fd7a3b24eae6c372cc57" FOREIGN KEY ("CREATED_BY") REFERENCES public."USERS"("USER_ID");


--
-- Name: ROLE FK_fd9db9681674bb23b2e69b2dc28; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ROLE"
    ADD CONSTRAINT "FK_fd9db9681674bb23b2e69b2dc28" FOREIGN KEY ("CREATED_BY") REFERENCES public."USERS"("USER_ID");


--
-- PostgreSQL database dump complete
--

