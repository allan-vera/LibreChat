import { parseISO, isToday, isWithinInterval, subDays, getYear } from 'date-fns';
import type {
  TConversation,
  ConversationData,
  ConversationUpdater,
  GroupedConversations,
} from 'librechat-data-provider';

const getGroupName = (date: Date) => {
  const now = new Date();
  if (isToday(date)) {
    return 'Today';
  }
  if (isWithinInterval(date, { start: subDays(now, 7), end: now })) {
    return 'Last 7 days';
  }
  if (isWithinInterval(date, { start: subDays(now, 30), end: now })) {
    return 'Last 30 days';
  }
  return ' ' + getYear(date).toString();
};

export const groupConversationsByDate = (conversations: TConversation[]): GroupedConversations => {
  if (!Array.isArray(conversations)) {
    return [];
  }

  const seenConversationIds = new Set();
  const groups = conversations.reduce((acc, conversation) => {
    if (seenConversationIds.has(conversation.conversation_id)) {
      return acc;
    }
    seenConversationIds.add(conversation.conversation_id);

    const date = parseISO(conversation.most_recent_message);
    const groupName = getGroupName(date);
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(conversation);
    return acc;
  }, {});

  const sortedGroups = {};
  const dateGroups = ['Today', 'Last 7 days', 'Last 30 days'];
  dateGroups.forEach((group) => {
    if (groups[group]) {
      sortedGroups[group] = groups[group];
    }
  });

  Object.keys(groups)
    .filter((group) => !dateGroups.includes(group))
    .sort()
    .reverse()
    .forEach((year) => {
      sortedGroups[year] = groups[year];
    });

  return Object.entries(sortedGroups);
};

export const addConversation: ConversationUpdater = (data, newConversation) => {
  const newData = JSON.parse(JSON.stringify(data)) as ConversationData;
  const { pageIndex, convIndex } = findPageForConversation(newData, newConversation);

  if (pageIndex !== -1 && convIndex !== -1) {
    return updateConversation(data, newConversation);
  }
  newData.pages[0].conversations.unshift({
    ...newConversation,
    updatedAt: new Date().toISOString(),
  });

  return newData;
};

export function findPageForConversation(
  data: ConversationData,
  conversation: TConversation | { conversationId: string },
) {
  for (let pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
    const page = data.pages[pageIndex];
    const convIndex = page.conversations.findIndex(
      (c) => c.conversationId === conversation.conversationId,
    );
    if (convIndex !== -1) {
      return { pageIndex, convIndex };
    }
  }
  return { pageIndex: -1, convIndex: -1 }; // Not found
}

export const updateConversation: ConversationUpdater = (data, updatedConversation) => {
  const newData = JSON.parse(JSON.stringify(data));
  const { pageIndex, convIndex } = findPageForConversation(newData, updatedConversation);

  if (pageIndex !== -1 && convIndex !== -1) {
    // Remove the conversation from its current position
    newData.pages[pageIndex].conversations.splice(convIndex, 1);
    // Add the updated conversation to the top of the first page
    newData.pages[0].conversations.unshift({
      ...updatedConversation,
      updatedAt: new Date().toISOString(),
    });
  }

  return newData;
};

export const updateConvoFields: ConversationUpdater = (
  data: ConversationData,
  updatedConversation: Partial<TConversation> & Pick<TConversation, 'conversationId'>,
): ConversationData => {
  const newData = JSON.parse(JSON.stringify(data));
  const { pageIndex, convIndex } = findPageForConversation(
    newData,
    updatedConversation as { conversationId: string },
  );

  if (pageIndex !== -1 && convIndex !== -1) {
    const deleted = newData.pages[pageIndex].conversations.splice(convIndex, 1);
    const oldConversation = deleted[0] as TConversation;

    newData.pages[0].conversations.unshift({
      ...oldConversation,
      ...updatedConversation,
      updatedAt: new Date().toISOString(),
    });
  }

  return newData;
};

export const deleteConversation = (
  data: ConversationData,
  conversationId: string,
): ConversationData => {
  const newData = JSON.parse(JSON.stringify(data));
  const { pageIndex, convIndex } = findPageForConversation(newData, { conversationId });

  if (pageIndex !== -1 && convIndex !== -1) {
    // Delete the conversation from its current page
    newData.pages[pageIndex].conversations.splice(convIndex, 1);
  }

  return newData;
};
