import RLReorderAgent from '@/components/RLReorderAgent';

export const metadata = {
  title: 'AnvayaAI | RL Reorder Agent',
  description: 'Q-Learning reinforcement learning agent making inventory reorder decisions.',
};

export default function RLAgentPage() {
  return (
    <div className="p-6 h-full">
      <RLReorderAgent />
    </div>
  );
}
