// Questionnaire Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
    id: string;
    question_text: string;
    question_order: number;
    weight: number;
    min_value: number;
    max_value: number;
}

interface QuestionnaireState {
    questions: Question[];
    currentResponses: Record<string, number>;
    logs: any[];
    loading: boolean;
}

const initialState: QuestionnaireState = {
    questions: [],
    currentResponses: {},
    logs: [],
    loading: false,
};

const questionnaireSlice = createSlice({
    name: 'questionnaire',
    initialState,
    reducers: {
        setQuestions: (state, action: PayloadAction<Question[]>) => {
            state.questions = action.payload;
        },
        setResponse: (state, action: PayloadAction<{ questionId: string; value: number }>) => {
            state.currentResponses[action.payload.questionId] = action.payload.value;
        },
        clearResponses: (state) => {
            state.currentResponses = {};
        },
        setLogs: (state, action: PayloadAction<any[]>) => {
            state.logs = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setQuestions, setResponse, clearResponses, setLogs, setLoading } = questionnaireSlice.actions;
export default questionnaireSlice.reducer;
