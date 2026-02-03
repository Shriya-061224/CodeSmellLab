
import { CodingTopic, Difficulty } from './types';

export const CODING_TOPICS: CodingTopic[] = [
  {
    id: 'stack',
    name: 'Stack (LIFO)',
    description: 'Master the Last-In-First-Out principle. Refactor naive array-based stacks into efficient, capped, or dynamic implementations.',
    difficulty: Difficulty.BEGINNER,
    category: 'Linear'
  },
  {
    id: 'queue',
    name: 'Queue (FIFO)',
    description: 'Implement First-In-First-Out logic. Transition from O(n) shift operations to O(1) pointer-based circular buffers.',
    difficulty: Difficulty.BEGINNER,
    category: 'Linear'
  },
  {
    id: 'linked-list',
    name: 'Singly Linked List',
    description: 'Learn pointer manipulation. Refactor inefficient node traversal and insertion logic.',
    difficulty: Difficulty.INTERMEDIATE,
    category: 'Linear'
  },
  {
    id: 'binary-tree',
    name: 'Binary Search Tree',
    description: 'Implement hierarchical data storage. Focus on balanced insertion and recursive traversal patterns.',
    difficulty: Difficulty.INTERMEDIATE,
    category: 'Non-Linear'
  },
  {
    id: 'hash-map',
    name: 'Hash Map / Dictionary',
    description: 'Master key-value storage. Refactor simple object storage into collision-resistant hashing implementations.',
    difficulty: Difficulty.ADVANCED,
    category: 'Non-Linear'
  },
  {
    id: 'min-max-heap',
    name: 'Priority Queue (Heap)',
    description: 'Implement efficient priority-based access. Refactor sorting-based priority into logarithmic heap operations.',
    difficulty: Difficulty.ADVANCED,
    category: 'Non-Linear'
  }
];

export const XP_PER_LEVEL = 1000;
