export type StudioTestimonial = {
  date: string;
  text: string;
  author: string;
  link?: string | null;
  linkHref?: string | null;
  image?: string | null;
  projectHref?: string | null;
  projectText?: string;
};

export const studioTestimonials: StudioTestimonial[] = [
  {
    date: 'April, 2020',
    text: 'A few months ago, in 2019, I was about to renovate the interior of my apartment, when many of my friends recommended Alexandra to me. I am infinitely glad that I turned to her professional services. Alexandra is an incredibly talented designer, full of wonderful ideas and a delicate taste.',
    author: 'Irina Antonova',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: '/images/legacy/testimonial-erika.jpg',
    projectHref: '#',
  },
  {
    date: 'April, 2020',
    text: "I am extremely satisfied with Alexandra's job. She had great ideas, very professional attitude and sweet personality. I would never be able to remodel those two bathrooms on my own.",
    author: 'Rita Roysental',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: null,
    projectHref: null,
  },
  {
    date: 'June 26, 2019',
    text: 'Hiring Alexandra was the best decision we made when decorating our new home. She is a pleasure to work with, has great taste, is highly organized and her attention to detail is most impressive.',
    author: 'Sergey Stelmakh',
    link: '@linkedin',
    linkHref: 'https://www.linkedin.com/in/alexandradiz',
    image: '/images/legacy/testimonial-sergey.jpg',
    projectHref: 'http://alexandradiz.com/california-ocean-house-in-paccifica',
    projectText: 'Press to see the project',
  },
  {
    date: 'May 8, 2019',
    text: 'Alexandra came up with multiple creative ideas we did not even think were possible. She provided detailed sketches extremely fast, was always open for iterations, and her patience was endless.',
    author: 'Homeowner, Pacifica',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: null,
    projectHref: null,
  },
  {
    date: '2019',
    text: 'Alexandra transformed our home beyond what we imagined possible. Her eye for detail, creative use of space, and ability to understand exactly what we wanted made the entire process smooth and enjoyable.',
    author: 'Client, Los Altos',
    image: null,
    projectHref: null,
  },
  {
    date: '2020',
    text: 'Working with Alexandra was an incredible experience from start to finish. She listened to our needs, presented creative solutions we had not considered, and managed every detail of the project flawlessly.',
    author: 'Homeowner, Redwood City',
    image: null,
    projectHref: null,
  },
];
