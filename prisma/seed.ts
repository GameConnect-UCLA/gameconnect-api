import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@gc.dev' } });
  if (existing) {
    console.log('Seed data already exists');
    return;
  }

  const hash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: { username: 'admin_user', displayName: 'Admin', email: 'admin@gc.dev', state: 'ACTIVE', role: 'ADMIN' },
  });
  const mod = await prisma.user.create({
    data: { username: 'mod_user', displayName: 'Moderator', email: 'mod@gc.dev', state: 'ACTIVE', role: 'MODERATOR' },
  });
  const user = await prisma.user.create({
    data: { username: 'test_user', displayName: 'Test User', email: 'test@gc.dev', state: 'ACTIVE', role: 'USER' },
  });

  await prisma.userAuth.createMany({
    data: [
      { userId: admin.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: mod.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: user.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
    ],
  });

  const zelda = await prisma.game.create({
    data: { metadata: { name: 'The Legend of Zelda: Tears of the Kingdom', genre: 'Action-adventure' }, score: 96 },
  });
  const elden = await prisma.game.create({
    data: { metadata: { name: 'Elden Ring', genre: 'Action RPG', cover_url: 'https://cdn.mos.cms.futurecdn.net/vVYdoxvuFkZMMBweq2iMUD-970-80.jpg'}, score: 95 },
  });

  const post1 = await prisma.post.create({
    data: { author: user.id, content: 'Just finished Elden Ring! **Amazing** game.', hashtags: ['eldenring', 'gaming'], isReview: true, reviewedGame: elden.id, reviewScore: 9.5, likesCounter: 0, commentsCounter: 0, createdAt: new Date() },
  });
  const post2 = await prisma.post.create({
    data: { author: mod.id, content: 'Anyone playing Zelda TOTK? The building mechanics are insane!', hashtags: ['zelda', 'nintendo'], likesCounter: 0, commentsCounter: 0, createdAt: new Date() },
  });
  const post3 = await prisma.post.create({
    data: { author: admin.id, content: 'Server maintenance tonight at 3 AM. Expect 30 min downtime.', hashtags: ['announcement'], likesCounter: 0, commentsCounter: 0, createdAt: new Date() },
  });
  const post4 = await prisma.post.create({
    data: { author: user.id, content: 'Best RPG of the year? I vote Elden Ring.', hashtags: ['rpg', 'debate'], isReview: true, reviewedGame: elden.id, reviewScore: 10, likesCounter: 0, commentsCounter: 0, createdAt: new Date() },
  });
  await prisma.post.create({
    data: { author: user.id, content: 'Great thread!', hashtags: ['repost'], isRepost: true, originalPostId: post2.id, likesCounter: 0, commentsCounter: 0, createdAt: new Date() },
  });

  await prisma.comment.create({ data: { parentId: post1.id, author: mod.id, content: 'Totally agree, masterpiece.', createdAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post2.id, author: user.id, content: 'Loving it so far!', createdAt: new Date() } });
  const sub = await prisma.comment.create({ data: { parentId: post2.id, author: admin.id, content: 'Same here!', createdAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post2.id, author: user.id, commentParentId: sub.id, content: 'Right? The physics engine is wild.', createdAt: new Date() } });

  await prisma.follow.createMany({
    data: [
      { followerId: user.id, followedId: mod.id, followedType: 'USER' },
      { followerId: user.id, followedId: admin.id, followedType: 'USER' },
      { followerId: admin.id, followedId: user.id, followedType: 'USER' },
    ],
  });

  await prisma.like.createMany({
    data: [
      { userId: user.id, postId: post1.id },
      { userId: user.id, postId: post2.id },
      { userId: mod.id, postId: post1.id },
      { userId: admin.id, postId: post4.id },
    ],
  });

  await prisma.favorite.createMany({
    data: [
      { userId: user.id, itemId: post1.id, itemType: 'POST' },
      { userId: user.id, itemId: post4.id, itemType: 'POST' },
    ],
  });

  await prisma.$executeRaw`INSERT INTO "favorite_game" ("id","user_id", "game_id") VALUES (${admin.id}, ${zelda.id})`;

  const conv = await prisma.conversation.create({
    data: { name: 'Gaming Squad', createdBy: admin.id, createdAt: new Date() },
  });
  await prisma.groupMember.createMany({
    data: [
      { userId: admin.id, conversationId: conv.id, role: 'OWNER', joinedAt: new Date() },
      { userId: mod.id, conversationId: conv.id, role: 'ADMIN', joinedAt: new Date() },
      { userId: user.id, conversationId: conv.id, role: 'MEMBER', joinedAt: new Date() },
    ],
  });

  const msg1 = await prisma.message.create({
    data: { sentBy: admin.id, conversationId: conv.id, type: 'GROUP_MESSAGE', messageText: 'Welcome to Gaming Squad!', sentAt: new Date() },
  });
  await prisma.message.create({
    data: { sentBy: user.id, conversationId: conv.id, type: 'GROUP_MESSAGE', messageText: 'Thanks! Happy to be here.', replyToId: msg1.id, sentAt: new Date() },
  });

  await prisma.notification.createMany({
    data: [
      { userId: user.id, type: 'LIKE', payload: { from: mod.id, postId: post1.id }, read: false, createdAt: new Date() },
      { userId: mod.id, type: 'FOLLOW', payload: { from: user.id }, read: false, createdAt: new Date() },
      { userId: admin.id, type: 'COMMENT', payload: { from: user.id, postId: post2.id }, read: false, createdAt: new Date() },
    ],
  });

  console.log('Seed created:', { admin: admin.id, mod: mod.id, user: user.id });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
