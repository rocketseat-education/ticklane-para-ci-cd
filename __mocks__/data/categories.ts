import type { Category } from '@/types';

export const categoriesMock: Category[] = [
  {
    id: 'cat-1',
    name: 'DevOps',
    slug: 'devops',
    description: 'Deploy e infraestrutura',
    checklistsCount: 12,
  },
  {
    id: 'cat-2',
    name: 'Engenharia',
    slug: 'engenharia',
    description: 'Práticas de engenharia',
    checklistsCount: 8,
  },
];
