interface BlockCounterProps {
  count: number;
}

export const BlockCounter = ({ count }: BlockCounterProps) => {
  return <span className="status-item">Blocks: {count}</span>;
};
