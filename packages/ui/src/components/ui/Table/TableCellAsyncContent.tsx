import {
  useEffect,
  useState,
} from 'react';

export type TableCellAsyncContentProps = {
  readonly content: string | Promise<string>;
};

export const TableCellAsyncContent = ({ content }: TableCellAsyncContentProps) => {
  const [text, setText] = useState<string>(null);
  useEffect(() => {
    const perform = async () => {
      if (content instanceof Promise) {
        setText(await content);
      } else {
        setText(content);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [content]);
  return (
    <>
      {text}
    </>
  );
};
