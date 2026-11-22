import {
  useEffect,
  useState,
} from 'react';

export type TableCellAsyncContentProps = {
  readonly content: Promise<string> | string;
};

export const TableCellAsyncContent = ({ content }: TableCellAsyncContentProps) => {
  const [text, setText] = useState<string>(null);
  useEffect(() => {
    let isCurrent = true;
    const perform = async () => {
      const resolvedText = content instanceof Promise ? await content : content;
      if (isCurrent) {
        setText(resolvedText);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
    return () => {
      isCurrent = false;
    };
  }, [content]);
  return (
    <>
      {text}
    </>
  );
};
