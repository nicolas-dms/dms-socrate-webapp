/**
 * Word List Service
 * Manages CRUD operations for user word lists
 */

import { getApiUrl } from './configService';

export interface WordLists {
  [listName: string]: string[];
}

/**
 * Get all word lists for a user
 */
export async function getAllWordLists(userId: string): Promise<WordLists> {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/users/${encodeURIComponent(userId)}/word-lists`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // User has no word lists yet
        return {};
      }
      throw new Error(`Failed to fetch word lists: ${response.statusText}`);
    }

    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error("Error fetching word lists:", error);
    throw error;
  }
}

/**
 * Get a specific word list by name
 */
export async function getWordList(
  userId: string,
  listName: string
): Promise<string[]> {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word list '${listName}' not found`);
      }
      throw new Error(`Failed to fetch word list: ${response.statusText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error fetching word list '${listName}':`, error);
    throw error;
  }
}

/**
 * Create or update a word list
 */
export async function createOrUpdateWordList(
  userId: string,
  listName: string,
  words: string[]
): Promise<WordLists> {
  try {
    // Validate inputs
    if (!listName.trim()) {
      throw new Error("List name cannot be empty");
    }

    if (words.length > 50) {
      throw new Error("Maximum 50 words per list");
    }

    // Filter out empty strings and validate word length
    const validWords = words
      .map(w => w.trim())
      .filter(w => w.length > 0 && w.length <= 100);

    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(validWords), // Send array directly
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to save word list: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error saving word list '${listName}':`, error);
    throw error;
  }
}

/**
 * Add words to an existing list (append)
 */
export async function addWordsToList(
  userId: string,
  listName: string,
  wordsToAdd: string[]
): Promise<WordLists> {
  try {
    const validWords = wordsToAdd
      .map(w => w.trim())
      .filter(w => w.length > 0 && w.length <= 100);

    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(validWords),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to add words: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error adding words to list '${listName}':`, error);
    throw error;
  }
}

/**
 * Delete a word list
 */
export async function deleteWordList(
  userId: string,
  listName: string
): Promise<WordLists> {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/users/${encodeURIComponent(userId)}/word-lists/${encodeURIComponent(listName)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word list '${listName}' not found`);
      }
      throw new Error(`Failed to delete word list: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error deleting word list '${listName}':`, error);
    throw error;
  }
}

/**
 * Parse comma-separated words into array
 */
export function parseWordsFromString(wordsString: string): string[] {
  return wordsString
    .split(",")
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

/**
 * Format words array into comma-separated string
 */
export function formatWordsToString(words: string[]): string {
  return words.join(", ");
}
