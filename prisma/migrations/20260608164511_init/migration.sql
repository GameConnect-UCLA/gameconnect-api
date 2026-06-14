-- CreateEnum
CREATE TYPE "UserState" AS ENUM ('ACTIVE', 'TO_DELETE');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('POST', 'GAME');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "FolloweeType" AS ENUM ('USER', 'GAME');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('GROUP_MESSAGE', 'DIRECT_MESSAGE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('LIKE', 'FOLLOW', 'COMMENT', 'MENTION', 'MESSAGE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportTarget" AS ENUM ('POST', 'REVIEW', 'COMMENT', 'USER', 'GAME');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('NSFW', 'HATE', 'SPAM', 'OTHER');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "username" VARCHAR(30),
    "display_name" VARCHAR(30),
    "pronouns" VARCHAR(30),
    "role" "UserRole",
    "email" VARCHAR(30),
    "bio" VARCHAR(120),
    "birth_date" DATE,
    "account_settings" JSONB,
    "profile_pic" TEXT,
    "cover_pic" TEXT,
    "verified" BOOLEAN,
    "state" "UserState",
    "banned_at" TIMESTAMPTZ,
    "ban_reason" TEXT,
    "created_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "provider_id" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followed_id" UUID NOT NULL,
    "followed_type" "FolloweeType" NOT NULL,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post" (
    "id" UUID NOT NULL,
    "author" UUID NOT NULL,
    "original_post_id" UUID,
    "title" TEXT,
    "content" TEXT,
    "media" JSONB,
    "hashtags" TEXT[],
    "is_review" BOOLEAN,
    "is_repost" BOOLEAN,
    "reviewed_game" UUID,
    "review_score" DOUBLE PRECISION,
    "likes_counter" INTEGER,
    "comments_counter" INTEGER,
    "created_at" TIMESTAMPTZ,
    "last_modified_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "comment_parent_id" UUID,
    "author" UUID NOT NULL,
    "content" TEXT,
    "media" JSONB,
    "created_at" TIMESTAMPTZ,
    "last_modified_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game" (
    "id" UUID NOT NULL,
    "metadata" JSONB,
    "score" INTEGER,
    "review_rating_count" INTEGER,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_staff" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "staff_title" VARCHAR(30),

    CONSTRAINT "game_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "item_type" "FavoriteType" NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL,
    "sent_by" UUID NOT NULL,
    "conversation" UUID,
    "reply_to" UUID,
    "type" "MessageType" NOT NULL,
    "message_text" TEXT,
    "attached_media" JSONB,
    "sent_at" TIMESTAMPTZ,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" UUID NOT NULL,
    "name" VARCHAR(30),
    "group_picture" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "conversation" UUID NOT NULL,
    "role" "GroupRole" NOT NULL,
    "joined_at" TIMESTAMPTZ,
    "left_at" TIMESTAMPTZ,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "EventType" NOT NULL,
    "payload" JSONB,
    "read" BOOLEAN,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "target_type" "ReportTarget" NOT NULL,
    "reason" "ReportReason",
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_author_fkey" FOREIGN KEY ("author") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_reviewed_game_fkey" FOREIGN KEY ("reviewed_game") REFERENCES "game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_comment_parent_id_fkey" FOREIGN KEY ("comment_parent_id") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_fkey" FOREIGN KEY ("author") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_staff" ADD CONSTRAINT "game_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_staff" ADD CONSTRAINT "game_staff_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_reply_to_fkey" FOREIGN KEY ("reply_to") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_fkey" FOREIGN KEY ("conversation") REFERENCES "conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_conversation_fkey" FOREIGN KEY ("conversation") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
