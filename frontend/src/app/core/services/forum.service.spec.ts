import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ForumService } from './forum.service';
import { STORAGE_KEYS } from '../models/auth.model';
import { CreatePostPayload, CreateReplyPayload, ForumAuthor } from '../../foro/models/foro.model';

describe('ForumService', () => {
  let service: ForumService;
  const mockAuthor: ForumAuthor = {
    id: 'user-1',
    name: 'Ana Silva',
    role: 'student',
    roleTitle: 'Estudiante',
    institution: 'Universidad Tecnológica',
    avatar: 'https://avatar.url',
    initials: 'AS',
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.FORUM_POSTS);

    TestBed.configureTestingModule({
      providers: [ForumService],
    });
    service = TestBed.inject(ForumService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEYS.FORUM_POSTS);
  });

  it('debe crearse correctamente e inicializar las publicaciones mock', () => {
    expect(service).toBeTruthy();
    expect(service.posts().length).toBeGreaterThan(0);
  });

  it('debe crear una nueva publicación y persistirla en localStorage', () => {
    const initialCount = service.posts().length;
    const payload: CreatePostPayload = {
      title: '¿Cómo optimizar algoritmos con programación dinámica?',
      content: 'Tengo dudas sobre memoización versus tabulación en problemas de optimización.',
      subject: 'Tecnología',
      academicReference: 'Cormen, T. Introduction to Algorithms',
    };

    const newPost = service.createPost(payload, mockAuthor);

    expect(newPost.id).toBeTruthy();
    expect(newPost.title).toBe(payload.title);
    expect(service.posts().length).toBe(initialCount + 1);

    const stored = localStorage.getItem(STORAGE_KEYS.FORUM_POSTS);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed[0].title).toBe(payload.title);
  });

  it('debe agregar una respuesta y persistirla en localStorage', () => {
    const post = service.posts()[0];
    const initialReplies = post.replies.length;

    const replyPayload: CreateReplyPayload = {
      postId: post.id,
      content: 'La memoización es un enfoque top-down mientras que tabulación es bottom-up.',
      isTeacherVerified: true,
    };

    const newReply = service.addReply(replyPayload, mockAuthor);

    expect(newReply.id).toBeTruthy();
    const updatedPost = service.posts().find((p) => p.id === post.id);
    expect(updatedPost?.replies.length).toBe(initialReplies + 1);
    expect(updatedPost?.isTeacherVerified).toBe(true);
  });

  it('debe alternar el voto útil (helpful) en una publicación', () => {
    const post = service.posts()[0];
    const initialCount = post.helpfulCount;

    service.toggleHelpfulPost(post.id);
    let currentPost = service.posts().find((p) => p.id === post.id);
    expect(currentPost?.helpfulCount).toBe(initialCount + 1);
    expect(currentPost?.userHasVotedHelpful).toBe(true);

    service.toggleHelpfulPost(post.id);
    currentPost = service.posts().find((p) => p.id === post.id);
    expect(currentPost?.helpfulCount).toBe(initialCount);
    expect(currentPost?.userHasVotedHelpful).toBe(false);
  });
});

