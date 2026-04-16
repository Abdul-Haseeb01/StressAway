// Chat Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
    id: string;
    message: string;
    is_user_message: boolean;
    created_at: string;
}

interface ChatState {
    messages: Message[];
    loading: boolean;
}

const initialState: ChatState = {
    messages: [],
    loading: false,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setMessages, addMessage, setLoading } = chatSlice.actions;
export default chatSlice.reducer;
