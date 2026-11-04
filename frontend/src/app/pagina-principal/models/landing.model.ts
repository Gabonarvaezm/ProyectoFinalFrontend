export interface Course {
  readonly id: string;
  readonly category: string;
  readonly rating: number;
  readonly title: string;
  readonly classesCount: number;
  readonly studentsCount: number;
  readonly price: string;
  readonly instructorName: string;
  readonly instructorAvatar: string;
  readonly image: string;
}

export interface Testimonial {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly avatar: string;
  readonly stars: number;
  readonly text: string;
}

