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

  const avatarAdmin = 'https://i.pravatar.cc/300?img=12';
  const avatarMod = 'https://i.pravatar.cc/300?img=32';
  const avatarUser = 'https://i.pravatar.cc/300?img=47';
  const avatarStreamer = 'https://i.pravatar.cc/300?img=15';
  const avatarReviewer = 'https://i.pravatar.cc/300?img=41';
  const avatarCollector = 'https://i.pravatar.cc/300?img=52';

  const coverAdmin = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80';
  const coverMod = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';
  const coverUser = 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1600&q=80';
  const coverStreamer = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80';
  const coverReviewer = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80';

  const heroShot = 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1400&q=80';
  const deskShot = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80';
  const setupShot = 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1400&q=80';
  const neonShot = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80';
  const handsShot = 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1400&q=80';

  const admin = await prisma.user.create({
    data: {
      username: 'admin_user',
      displayName: 'Admin',
      email: 'admin@gc.dev',
      state: 'ACTIVE',
      role: 'ADMIN',
      bio: 'Administro la comunidad de GameConnect y también me escondo en los lobbies más competitivos.',
      pronouns: 'they/them',
      verified: true,
      profilePic: avatarAdmin,
      coverPic: coverAdmin,
      birthDate: new Date('1992-04-18'),
      createdAt: new Date(),
      accountSettings: {
        theme: 'dark',
        notifications: true,
        language: 'es',
      },
    },
  });
  const mod = await prisma.user.create({
    data: {
      username: 'mod_user',
      displayName: 'Moderator',
      email: 'mod@gc.dev',
      state: 'ACTIVE',
      role: 'MODERATOR',
      bio: 'Juego de noche, reviso posts de día y siempre tengo un buen hot take sobre RPGs.',
      pronouns: 'she/her',
      verified: true,
      profilePic: avatarMod,
      coverPic: coverMod,
      birthDate: new Date('1994-09-03'),
      createdAt: new Date(),
      accountSettings: {
        theme: 'midnight',
        notifications: true,
        language: 'en',
      },
    },
  });
  const user = await prisma.user.create({
    data: {
      username: 'test_user',
      displayName: 'Test User',
      email: 'test@gc.dev',
      state: 'ACTIVE',
      role: 'USER',
      bio: 'Termino campañas, subo clips y debato sobre las mejores historias en videojuegos.',
      pronouns: 'he/him',
      verified: false,
      profilePic: avatarUser,
      coverPic: coverUser,
      birthDate: new Date('1998-11-21'),
      createdAt: new Date(),
      accountSettings: {
        theme: 'aurora',
        notifications: true,
        language: 'es',
      },
    },
  });

  const streamer = await prisma.user.create({
    data: {
      username: 'streamer_sora',
      displayName: 'Sora Live',
      email: 'sora@gc.dev',
      state: 'ACTIVE',
      role: 'USER',
      bio: 'Streamer de soulslikes, shooters y cualquier cosa que tenga un boss final absurdo.',
      pronouns: 'she/her',
      verified: true,
      profilePic: avatarStreamer,
      coverPic: coverStreamer,
      birthDate: new Date('2000-06-12'),
      createdAt: new Date(),
      accountSettings: {
        theme: 'neon',
        notifications: false,
        language: 'en',
      },
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      username: 'reviewer_lyra',
      displayName: 'Lyra Bytes',
      email: 'lyra@gc.dev',
      state: 'ACTIVE',
      role: 'USER',
      bio: 'Analizo gameplay, diseño y banda sonora; si un juego me rompe el corazón, mejor reseña todavía.',
      pronouns: 'they/them',
      verified: false,
      profilePic: avatarReviewer,
      coverPic: coverReviewer,
      birthDate: new Date('1996-02-28'),
      createdAt: new Date(),
      accountSettings: {
        theme: 'minimal',
        notifications: true,
        language: 'es',
      },
    },
  });

  const collector = await prisma.user.create({
    data: {
      username: 'collector_neo',
      displayName: 'Neo Collector',
      email: 'neo@gc.dev',
      state: 'ACTIVE',
      role: 'USER',
      bio: 'Colecciono platinos, figuritas y recuerdos de juegos que me marcaron.',
      pronouns: 'he/him',
      verified: false,
      profilePic: avatarCollector,
      coverPic: 'https://images.unsplash.com/photo-1542751371-653f06c3ca4d?auto=format&fit=crop&w=1600&q=80',
      birthDate: new Date('1991-08-09'),
      createdAt: new Date(),
      accountSettings: {
        theme: 'space',
        notifications: true,
        language: 'es',
      },
    },
  });

  await prisma.userAuth.createMany({
    data: [
      { userId: admin.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: mod.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: user.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: streamer.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: reviewer.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
      { userId: collector.id, provider: 'local', passwordHash: hash, createdAt: new Date() },
    ],
  });

  const zelda = await prisma.game.create({
    data: {
      metadata: {
        name: 'The Legend of Zelda: Tears of the Kingdom',
        genre: 'Action-adventure',
        cover_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        platforms: ['Nintendo Switch'],
        release_year: 2023,
      },
      score: 96,
      reviewRatingCount: 18450,
    },
  });
  const elden = await prisma.game.create({
    data: {
      metadata: {
        name: 'Elden Ring',
        genre: 'Action RPG',
        cover_url: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80',
        platforms: ['PS5', 'Xbox Series X|S', 'PC'],
        release_year: 2022,
      },
      score: 95,
      reviewRatingCount: 22110,
    },
  });

  const hades = await prisma.game.create({
    data: {
      metadata: {
        name: 'Hades II',
        genre: 'Roguelike action',
        cover_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1200&q=80',
        platforms: ['PC', 'Nintendo Switch'],
        release_year: 2024,
      },
      score: 94,
      reviewRatingCount: 8600,
    },
  });

  const bg3 = await prisma.game.create({
    data: {
      metadata: {
        name: 'Baldur\'s Gate 3',
        genre: 'CRPG',
        cover_url: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1200&q=80',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        release_year: 2023,
      },
      score: 97,
      reviewRatingCount: 26800,
    },
  });

  const post1 = await prisma.post.create({
    data: {
      author: user.id,
      title: 'Elden Ring sigue siendo una obra maestra',
      content: 'Just finished Elden Ring! **Amazing** game.',
      media: { urls: [heroShot] },
      hashtags: ['eldenring', 'gaming'],
      isReview: true,
      reviewedGame: elden.id,
      reviewScore: 9.5,
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });
  const post2 = await prisma.post.create({
    data: {
      author: mod.id,
      title: 'TOTK y sus mecánicas locas',
      content: 'Anyone playing Zelda TOTK? The building mechanics are insane!',
      hashtags: ['zelda', 'nintendo'],
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });
  const post3 = await prisma.post.create({
    data: {
      author: admin.id,
      title: 'Mantenimiento del servidor',
      content: 'Server maintenance tonight at 3 AM. Expect 30 min downtime.',
      media: { urls: [deskShot] },
      hashtags: ['announcement'],
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });
  const post4 = await prisma.post.create({
    data: {
      author: user.id,
      title: '¿El mejor RPG del año?',
      content: 'Best RPG of the year? I vote Elden Ring.',
      media: { urls: [neonShot, handsShot] },
      hashtags: ['rpg', 'debate'],
      isReview: true,
      reviewedGame: elden.id,
      reviewScore: 10,
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });
  const post5 = await prisma.post.create({
    data: {
      author: streamer.id,
      title: 'Night stream setup',
      content: 'Estoy preparando una sesión larga para ver si hoy cae el boss.',
      media: { urls: [setupShot, deskShot, neonShot] },
      hashtags: ['stream', 'soulslike', 'setup'],
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });
  const post6 = await prisma.post.create({
    data: {
      author: reviewer.id,
      title: 'Baldur\'s Gate 3, lo que más me sorprendió',
      content: 'Hay juegos que te cambian la forma de mirar el género. BG3 es uno de ellos.',
      media: { urls: [heroShot] },
      hashtags: ['bg3', 'review', 'rpg'],
      isReview: true,
      reviewedGame: bg3.id,
      reviewScore: 9.8,
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });
  const post7 = await prisma.post.create({
    data: {
      author: collector.id,
      title: 'Mi estantería de favoritos',
      content: 'Great thread!',
      hashtags: ['repost', 'collection'],
      isRepost: true,
      originalPostId: post2.id,
      likesCounter: 0,
      commentsCounter: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  });

  await prisma.comment.create({ data: { parentId: post1.id, author: mod.id, content: 'Totally agree, masterpiece.', createdAt: new Date(), lastModifiedAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post2.id, author: user.id, content: 'Loving it so far!', createdAt: new Date(), lastModifiedAt: new Date() } });
  const sub = await prisma.comment.create({ data: { parentId: post2.id, author: admin.id, content: 'Same here!', createdAt: new Date(), lastModifiedAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post2.id, author: user.id, commentParentId: sub.id, content: 'Right? The physics engine is wild.', createdAt: new Date(), lastModifiedAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post5.id, author: user.id, content: 'Ese setup está criminal. Quiero ver la stream.', createdAt: new Date(), lastModifiedAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post5.id, author: mod.id, content: 'Aprobado por el panel de RGB.', createdAt: new Date(), lastModifiedAt: new Date() } });
  const post6FirstComment = await prisma.comment.create({ data: { parentId: post6.id, author: streamer.id, content: 'Necesito probar esa ruta de diálogo.', createdAt: new Date(), lastModifiedAt: new Date() } });
  await prisma.comment.create({ data: { parentId: post6.id, author: collector.id, commentParentId: post6FirstComment.id, content: 'Y encima la música no deja de mejorar.', createdAt: new Date(), lastModifiedAt: new Date() } });

  await prisma.follow.createMany({
    data: [
      { followerId: user.id, followedId: mod.id, followedType: 'USER' },
      { followerId: user.id, followedId: admin.id, followedType: 'USER' },
      { followerId: admin.id, followedId: user.id, followedType: 'USER' },
      { followerId: streamer.id, followedId: reviewer.id, followedType: 'USER' },
      { followerId: streamer.id, followedId: mod.id, followedType: 'USER' },
      { followerId: reviewer.id, followedId: user.id, followedType: 'USER' },
      { followerId: collector.id, followedId: admin.id, followedType: 'USER' },
      { followerId: collector.id, followedId: streamer.id, followedType: 'USER' },
    ],
  });

  await prisma.like.createMany({
    data: [
      { userId: user.id, postId: post1.id },
      { userId: user.id, postId: post2.id },
      { userId: mod.id, postId: post1.id },
      { userId: admin.id, postId: post4.id },
      { userId: streamer.id, postId: post1.id },
      { userId: streamer.id, postId: post6.id },
      { userId: reviewer.id, postId: post5.id },
      { userId: reviewer.id, postId: post1.id },
      { userId: collector.id, postId: post5.id },
      { userId: collector.id, postId: post6.id },
    ],
  });

  await prisma.favorite.createMany({
    data: [
      { userId: user.id, itemId: post1.id, itemType: 'POST' },
      { userId: user.id, itemId: post4.id, itemType: 'POST' },
      { userId: streamer.id, itemId: post5.id, itemType: 'POST' },
      { userId: reviewer.id, itemId: post6.id, itemType: 'POST' },
      { userId: collector.id, itemId: post7.id, itemType: 'POST' },
    ],
  });

  await prisma.favoriteGame.create({ data: { userId: admin.id, gameId: zelda.id } });

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
