import type {
  SignalCommentItem,
  SignalDetailData,
} from '@/components/SignalDetailDrawer';

export type SignalSummary = SignalDetailData;

export type SignalDetail = Omit<SignalDetailData, 'comments'> & {
  comments: SignalCommentItem[];
};
