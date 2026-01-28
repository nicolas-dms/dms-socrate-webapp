# Word Lists API - Frontend Integration Guide

## Overview

The Word Lists feature allows users to create and manage custom word lists for personalized dictation and spelling exercises. Word lists are stored directly in the user profile and can be managed through dedicated REST API endpoints.

---

## Data Structure

### User Model Update

The `UserModel` now includes a `word_lists` field:

```typescript
interface User {
  // ... existing fields
  word_lists?: {
    [listName: string]: string[];  // Dictionary of list_name -> array of words
  };
}
```

### Example Data

```json
{
  "word_lists": {
    "my_difficult_words": ["oiseau", "papillon", "grenouille", "libellule"],
    "animals": ["chat", "chien", "poisson", "lapin"],
    "family_words": ["père", "mère", "soeur", "frère", "grand-mère"]
  }
}
```

---

## API Endpoints

All endpoints use the base URL: `https://your-api.com/api`

### 1. Get All Word Lists

**Endpoint:** `GET /users/{user_id}/word-lists`

**Description:** Retrieve all word lists for a user

**Response:**
```json
{
  "my_words": ["oiseau", "papillon", "grenouille"],
  "animals": ["chat", "chien", "poisson"]
}
```

**TypeScript Example:**
```typescript
async function getAllWordLists(userId: string): Promise<Record<string, string[]>> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/word-lists`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add authentication headers as needed
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch word lists');
  }
  
  return await response.json();
}
```

---

### 2. Get Specific Word List

**Endpoint:** `GET /users/{user_id}/word-lists/{list_name}`

**Description:** Retrieve a specific word list by name

**Response:**
```json
["oiseau", "papillon", "grenouille", "libellule"]
```

**TypeScript Example:**
```typescript
async function getWordList(userId: string, listName: string): Promise<string[]> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Word list '${listName}' not found`);
    }
    throw new Error('Failed to fetch word list');
  }
  
  return await response.json();
}
```

---

### 3. Create or Replace Word List

**Endpoint:** `PUT /users/{user_id}/word-lists/{list_name}`

**Description:** Create a new word list or completely replace an existing one

**Request Body:** Array of words
```json
["oiseau", "papillon", "grenouille", "libellule"]
```

**Response:** All word lists after update
```json
{
  "my_words": ["oiseau", "papillon", "grenouille", "libellule"],
  "animals": ["chat", "chien"]
}
```

**Validation Rules:**
- List name cannot be empty
- Maximum 500 words per list
- Each word must be a string
- Maximum 100 characters per word
- Empty strings are automatically removed

**TypeScript Example:**
```typescript
async function createOrUpdateWordList(
  userId: string,
  listName: string,
  words: string[]
): Promise<Record<string, string[]>> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(words)  // Send array directly, not wrapped in object
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update word list');
  }
  
  return await response.json();
}

// Usage
await createOrUpdateWordList('user@example.com', 'my_words', [
  'oiseau',
  'papillon',
  'grenouille'
]);
```

---

### 4. Add Words to Existing List (Append)

**Endpoint:** `PATCH /users/{user_id}/word-lists/{list_name}`

**Description:** Add new words to an existing list without replacing it

**Request Body:** Array of words to add
```json
["nouveau", "mot", "ajouté"]
```

**Response:** All word lists after update

**Use Case:** When user wants to add a few words to their existing list without retyping everything

**TypeScript Example:**
```typescript
async function addWordsToList(
  userId: string,
  listName: string,
  wordsToAdd: string[]
): Promise<Record<string, string[]>> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wordsToAdd)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add words');
  }
  
  return await response.json();
}

// Usage
await addWordsToList('user@example.com', 'my_words', ['nouveau', 'mot']);
```

---

### 5. Delete Word List

**Endpoint:** `DELETE /users/{user_id}/word-lists/{list_name}`

**Description:** Delete a specific word list

**Response:** Remaining word lists after deletion

**TypeScript Example:**
```typescript
async function deleteWordList(
  userId: string,
  listName: string
): Promise<Record<string, string[]>> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Word list '${listName}' not found`);
    }
    throw new Error('Failed to delete word list');
  }
  
  return await response.json();
}
```

---

### 6. Replace All Word Lists (Bulk Update)

**Endpoint:** `PUT /users/{user_id}/word-lists`

**Description:** Replace all word lists at once (bulk operation)

**Request Body:** Complete word lists dictionary
```json
{
  "my_words": ["oiseau", "papillon"],
  "animals": ["chat", "chien"],
  "family": ["père", "mère"]
}
```

**Response:** Updated word lists

**Validation Rules:**
- Maximum 50 word lists per user
- Each list follows the same validation as single list update

**Use Case:** Full synchronization, importing word lists, or restoring from backup

**TypeScript Example:**
```typescript
async function replaceAllWordLists(
  userId: string,
  wordLists: Record<string, string[]>
): Promise<Record<string, string[]>> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}/word-lists`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wordLists)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to replace word lists');
  }
  
  return await response.json();
}

// Usage - full sync
await replaceAllWordLists('user@example.com', {
  list1: ['word1', 'word2'],
  list2: ['word3', 'word4']
});
```

---

## Complete React/TypeScript Service Class

```typescript
// services/wordListService.ts

export interface WordLists {
  [listName: string]: string[];
}

export class WordListService {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Get all word lists for a user
   */
  async getAllWordLists(userId: string): Promise<WordLists> {
    const response = await fetch(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/word-lists`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch word lists');
    }
    
    return await response.json();
  }
  
  /**
   * Get a specific word list
   */
  async getWordList(userId: string, listName: string): Promise<string[]> {
    const response = await fetch(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word list '${listName}' not found`);
      }
      throw new Error('Failed to fetch word list');
    }
    
    return await response.json();
  }
  
  /**
   * Create or completely replace a word list
   */
  async createOrUpdateWordList(
    userId: string,
    listName: string,
    words: string[]
  ): Promise<WordLists> {
    const response = await fetch(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(words)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update word list');
    }
    
    return await response.json();
  }
  
  /**
   * Add words to an existing list (append mode)
   */
  async addWordsToList(
    userId: string,
    listName: string,
    wordsToAdd: string[]
  ): Promise<WordLists> {
    const response = await fetch(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordsToAdd)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add words');
    }
    
    return await response.json();
  }
  
  /**
   * Delete a word list
   */
  async deleteWordList(userId: string, listName: string): Promise<WordLists> {
    const response = await fetch(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word list '${listName}' not found`);
      }
      throw new Error('Failed to delete word list');
    }
    
    return await response.json();
  }
  
  /**
   * Replace all word lists (bulk operation)
   */
  async replaceAllWordLists(
    userId: string,
    wordLists: WordLists
  ): Promise<WordLists> {
    const response = await fetch(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/word-lists`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordLists)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to replace word lists');
    }
    
    return await response.json();
  }
}

// Export singleton instance
export const wordListService = new WordListService();
```

---

## React Hook Example

```typescript
// hooks/useWordLists.ts
import { useState, useEffect, useCallback } from 'react';
import { wordListService, WordLists } from '../services/wordListService';

export function useWordLists(userId: string) {
  const [wordLists, setWordLists] = useState<WordLists>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadWordLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const lists = await wordListService.getAllWordLists(userId);
      setWordLists(lists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load word lists');
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    loadWordLists();
  }, [loadWordLists]);
  
  const createOrUpdateList = async (listName: string, words: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const updated = await wordListService.createOrUpdateWordList(userId, listName, words);
      setWordLists(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update list');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteList = async (listName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updated = await wordListService.deleteWordList(userId, listName);
      setWordLists(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    wordLists,
    loading,
    error,
    refresh: loadWordLists,
    createOrUpdate: createOrUpdateList,
    deleteList
  };
}
```

---

## Common Use Cases

### 1. Display User's Word Lists
```typescript
function WordListsDisplay({ userId }: { userId: string }) {
  const { wordLists, loading, error } = useWordLists(userId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {Object.entries(wordLists).map(([listName, words]) => (
        <div key={listName}>
          <h3>{listName}</h3>
          <ul>
            {words.map((word, idx) => (
              <li key={idx}>{word}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### 2. Create New Word List
```typescript
async function handleCreateList(userId: string, listName: string, words: string[]) {
  try {
    await wordListService.createOrUpdateWordList(userId, listName, words);
    console.log('List created successfully');
  } catch (error) {
    console.error('Failed to create list:', error);
  }
}
```

### 3. Add Words to Existing List
```typescript
async function handleAddWords(userId: string, listName: string, newWords: string[]) {
  try {
    await wordListService.addWordsToList(userId, listName, newWords);
    console.log('Words added successfully');
  } catch (error) {
    console.error('Failed to add words:', error);
  }
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Validation error (check `detail` in response)
- `404 Not Found` - User or word list not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

**TypeScript Error Handling:**
```typescript
try {
  await wordListService.createOrUpdateWordList(userId, listName, words);
} catch (error) {
  if (error instanceof Error) {
    // Show error to user
    showNotification(error.message, 'error');
  }
}
```

---

## Validation Constraints

### Word Lists (Overall)
- Maximum **50 word lists** per user
- Dictionary keys (list names) cannot be empty

### Individual Word List
- Maximum **500 words** per list
- List name cannot be empty or whitespace-only

### Individual Words
- Must be strings
- Maximum **100 characters** per word
- Empty/whitespace-only words are automatically filtered out
- Duplicates are allowed (backend doesn't de-duplicate)

---

## Migration Notes

**Existing Users:** The `word_lists` field defaults to an empty dictionary `{}` for users who haven't created any lists yet. No migration is needed.

**Backward Compatibility:** This feature is additive - existing user data and functionality remain unchanged.

---

## Testing Checklist

- [ ] Fetch empty word lists for new user
- [ ] Create first word list
- [ ] Add multiple word lists
- [ ] Update existing word list (replace)
- [ ] Append words to existing list
- [ ] Delete word list
- [ ] Handle validation errors (empty names, too many words, etc.)
- [ ] Handle network errors gracefully
- [ ] Test with special characters in list names
- [ ] Test with accented characters in words (é, è, à, etc.)
- [ ] Verify maximum limits (500 words, 50 lists)

---

## Support

For questions or issues, contact the backend team or refer to the FastAPI auto-generated docs at `/docs` when the server is running.
