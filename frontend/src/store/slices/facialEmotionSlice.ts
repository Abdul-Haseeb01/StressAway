// Facial Emotion Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FacialEmotionState {
    logs: any[];
    loading: boolean;
    modelLoaded: boolean;
}

const initialState: FacialEmotionState = {
    logs: [],
    loading: false,
    modelLoaded: false,
};

const facialEmotionSlice = createSlice({
    name: 'facialEmotion',
    initialState,
    reducers: {
        setLogs: (state, action: PayloadAction<any[]>) => {
            state.logs = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setModelLoaded: (state, action: PayloadAction<boolean>) => {
            state.modelLoaded = action.payload;
        },
    },
});

export const { setLogs, setLoading, setModelLoaded } = facialEmotionSlice.actions;
export default facialEmotionSlice.reducer;
