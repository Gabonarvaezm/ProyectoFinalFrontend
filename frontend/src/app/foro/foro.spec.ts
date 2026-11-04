import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Foro } from './foro';

describe('Foro Component', () => {
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

  it('should create the Foro component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default posts and filters', () => {
    expect(component.posts().length).toBeGreaterThan(0);
    expect(component.selectedSubject()).toBe('All Subjects');
    expect(component.filteredPosts().length).toBe(component.posts().length);
  });

  it('should filter posts by subject', () => {
    component.onSelectSubject('Matemáticas');
    const mathPosts = component.filteredPosts();
    expect(mathPosts.every((p) => p.subject === 'Matemáticas')).toBe(true);
  });

  it('should filter posts by search query', () => {
    const inputEvent = { target: { value: 'integrales' } } as unknown as Event;
    component.onSearchInput(inputEvent);
    expect(component.filteredPosts().length).toBeGreaterThan(0);
    expect(
      component.filteredPosts()[0].title.toLowerCase().includes('integrales')
    ).toBe(true);
  });

  it('should validate postForm requiring title and content min length', () => {
    const form = component.postForm;
    form.setValue({
      title: '',
      subject: 'Matemáticas',
      content: '',
      academicReference: '',
    });
    expect(form.valid).toBe(false);
    expect(form.get('title')?.hasError('required')).toBe(true);
    expect(form.get('content')?.hasError('required')).toBe(true);

    form.patchValue({
      title: 'Valid Academic Title Here',
      content: 'This is a sufficiently long description that satisfies the minimum length requirement.',
    });
    expect(form.valid).toBe(true);
  });

  it('should toggle helpful votes on a post', () => {
    const post = component.posts()[0];
    const initialHelpful = post.helpfulCount;

    component.toggleHelpful(post);
    const updatedPost = component.posts().find((p) => p.id === post.id);
    expect(updatedPost?.helpfulCount).toBe(initialHelpful + 1);
    expect(updatedPost?.userHasVotedHelpful).toBe(true);

    // Toggle back
    component.toggleHelpful(updatedPost!);
    const toggledBack = component.posts().find((p) => p.id === post.id);
    expect(toggledBack?.helpfulCount).toBe(initialHelpful);
    expect(toggledBack?.userHasVotedHelpful).toBe(false);
  });

  it('should toggle user role between student and professor', () => {
    expect(component.currentRole()).toBe('student');
    component.toggleRole();
    expect(component.currentRole()).toBe('professor');
    expect(component.currentUser().role).toBe('professor');
  });

  it('should prefill reply with AI draft response', () => {
    component.applyAiDraftResponse();
    expect(component.replyForm.get('content')?.value).toContain('LIATE');
  });
});
