// Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import questionnaireReducer from './slices/questionnaireSlice';
import facialEmotionReducer from './slices/facialEmotionSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        questionnaire: questionnaireReducer,
        facialEmotion: facialEmotionReducer,
        chat: chatReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
