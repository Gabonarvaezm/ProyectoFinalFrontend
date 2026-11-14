import { effect } from '@angular/core';
import { AcademicSyncService } from './academic-sync.service';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CreatePostPayload,
  CreateReplyPayload,
  ForumAuthor,
  ForumPost,
  ForumReply,
} from '../../foro/models/foro.model';
import { INITIAL_FORUM_POSTS } from '../../foro/data/foro.data';
import { STORAGE_KEYS } from '../models/auth.model';

/**
 * Servicio Centralizado de Foros Académicos (ForumService / ForoService).
 * Maneja publicaciones, respuestas, votos de utilidad y verificación docente con persistencia compartida y caché local.
 */
@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sync = inject(AcademicSyncService);

  public readonly posts = signal<ForumPost[]>(this.loadInitialPosts());

  constructor() {
    effect(() => {
      const state = this.sync.snapshot();
      if (!state) {
        if (this.sync.enabled()) this.posts.set([...INITIAL_FORUM_POSTS]);
        return;
      }
      this.posts.set(state.posts);
    });
  }

  private loadInitialPosts(): ForumPost[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.FORUM_POSTS);
        if (stored) {
          const parsed = JSON.parse(stored) as ForumPost[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[ForumService] Error al leer publicaciones de localStorage:', err);
      }
    }
    return [...INITIAL_FORUM_POSTS];
  }

  private persist(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEYS.FORUM_POSTS, JSON.stringify(this.posts()));
      } catch (err) {
        console.warn('[ForumService] Error al persistir publicaciones en localStorage:', err);
      }
    }
  }

  /**
   * Crea una nueva publicación en el foro
   */
  public createPost(payload: CreatePostPayload, author: ForumAuthor): ForumPost {
    const newPost: ForumPost = {
      id: `post-${crypto.randomUUID()}`,
      title: payload.title.trim(),
      content: payload.content.trim(),
      subject: payload.subject,
      author,
      createdAt: 'Hace un momento',
      helpfulCount: 0,
      userHasVotedHelpful: false,
      repliesCount: 0,
      viewsCount: 1,
      isUnanswered: true,
      isTeacherVerified: author.role === 'professor',
      academicReference: payload.academicReference?.trim() || undefined,
      replies: [],
    };

    this.posts.update((list) => [newPost, ...list]);
    this.persist();
    this.sync.publish('post.publish', newPost);
    return newPost;
  }

  /**
   * Agrega una respuesta a una publicación existente
   */
  public addReply(payload: CreateReplyPayload, author: ForumAuthor): ForumReply {
    const newReply: ForumReply = {
      id: `reply-${crypto.randomUUID()}`,
      postId: payload.postId,
      author,
      content: payload.content.trim(),
      createdAt: 'Hace un momento',
      helpfulCount: 0,
      userHasVotedHelpful: false,
      isTeacherVerified: !!payload.isTeacherVerified,
      academicReference: payload.academicReference?.trim() || undefined,
    };

    this.posts.update((list) =>
      list.map((post) => {
        if (post.id === payload.postId) {
          return {
            ...post,
            repliesCount: post.repliesCount + 1,
            isUnanswered: false,
            isTeacherVerified: post.isTeacherVerified || !!payload.isTeacherVerified,
            replies: [...post.replies, newReply],
          };
        }
        return post;
      })
    );
    this.persist();
    this.sync.publish('post.reply', newReply);
    return newReply;
  }

  /**
   * Alterna el voto de utilidad en una publicación
   */
  public toggleHelpfulPost(postId: string): void {
    this.posts.update((list) =>
      list.map((p) => {
        if (p.id === postId) {
          const wasVoted = !!p.userHasVotedHelpful;
          return {
            ...p,
            userHasVotedHelpful: !wasVoted,
            helpfulCount: wasVoted ? Math.max(0, p.helpfulCount - 1) : p.helpfulCount + 1,
          };
        }
        return p;
      })
    );
    this.persist();
    this.sync.publish('post.vote', { postId, voted: this.posts().find((post) => post.id === postId)?.userHasVotedHelpful ?? false });
  }

  /**
   * Alterna el voto de utilidad en una respuesta específica
   */
  public toggleHelpfulReply(postId: string, replyId: string): void {
    this.posts.update((list) =>
      list.map((post) => {
        if (post.id === postId) {
          const updatedReplies = post.replies.map((r) => {
            if (r.id === replyId) {
              const wasVoted = !!r.userHasVotedHelpful;
              return {
                ...r,
                userHasVotedHelpful: !wasVoted,
                helpfulCount: wasVoted ? Math.max(0, r.helpfulCount - 1) : r.helpfulCount + 1,
              };
            }
            return r;
          });
          return { ...post, replies: updatedReplies };
        }
        return post;
      })
    );
    this.persist();
    this.sync.publish('post.vote', { postId, replyId, voted: this.posts().find((post) => post.id === postId)?.replies.find((reply) => reply.id === replyId)?.userHasVotedHelpful ?? false });
  }

  /**
   * Restablece el foro a sus publicaciones iniciales
   */
  public resetToDefaults(): void {
    this.posts.set([...INITIAL_FORUM_POSTS]);
    this.persist();
  }
}

export { ForumService as ForoService };
