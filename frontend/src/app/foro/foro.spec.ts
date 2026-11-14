import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Foro } from './foro';

describe('Foro Component (Parent Orchestrator & Child Nodes)', () => {
  let component: Foro;
  let fixture: ComponentFixture<Foro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Foro],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Foro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the parent Foro component and initialize signals', () => {
    expect(component).toBeTruthy();
    expect(component.posts().length).toBeGreaterThan(0);
    expect(component.selectedSubject()).toBe('Todas las Materias');
  });

  it('should update filteredPosts when filters node modifies subject or search query', () => {
    component.onFilterChanged({ subject: 'Matemáticas', query: 'integrales' });
    const filtered = component.filteredPosts();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p.subject === 'Matemáticas')).toBe(true);
  });

  it('should toggle helpful votes when post card node emits helpfulVote', () => {
    const post = component.posts()[0];
    const initialHelpful = post.helpfulCount;

    component.handleHelpfulVote(post);
    const updated = component.posts().find((p) => p.id === post.id);
    expect(updated?.helpfulCount).toBe(initialHelpful + 1);
    expect(updated?.userHasVotedHelpful).toBe(true);

    component.handleHelpfulVote(updated!);
    const reverted = component.posts().find((p) => p.id === post.id);
    expect(reverted?.helpfulCount).toBe(initialHelpful);
    expect(reverted?.userHasVotedHelpful).toBe(false);
  });

  it('should add a new reply when post card node emits replySubmit', () => {
    const targetPost = component.posts()[0];
    const initialReplies = targetPost.repliesCount;

    component.handleReplySubmit({
      postId: targetPost.id,
      content: 'Respuesta académica de prueba verificada con rigor.',
      academicReference: 'Bibliografía de prueba',
      isTeacherVerified: false,
    });

    const updated = component.posts().find((p) => p.id === targetPost.id);
    expect(updated?.repliesCount).toBe(initialReplies + 1);
    expect(updated?.replies.some((r) => r.content.includes('rigor'))).toBe(true);
  });

  it('should coordinate node-to-node communication when AI widget requests draft response', () => {
    const suggestion = component.aiSuggestion();
    component.handleAiDraftRequested(suggestion);

    expect(component.activeExpandedPostId()).toBe(suggestion.postId);
    expect(component.activeDraftContent()).toBe(suggestion.draftResponse);
  });

  it('should add a new post when create modal node emits postSubmitted', async () => {
    const initialCount = component.posts().length;
    component.handlePostSubmitted({
      title: 'Nueva Consulta sobre Álgebra Lineal',
      subject: 'Matemáticas',
      content: 'Descripción de prueba suficientemente larga para cumplir los criterios.',
      academicReference: 'Strang, G. (2016). Linear Algebra.',
    });

    // Simulamos la respuesta asíncrona del modal
    await new Promise((r) => setTimeout(r, 450));
    expect(component.posts().length).toBe(initialCount + 1);
    expect(component.posts()[0].title).toBe('Nueva Consulta sobre Álgebra Lineal');
  });

  it('should use the student perspective by default without a role switch', () => {
    expect(component.currentRole()).toBe('student');
    expect(component.currentUser().role).toBe('student');
    expect(fixture.nativeElement.querySelector('.role-badge-btn')).toBeNull();
  });
});
