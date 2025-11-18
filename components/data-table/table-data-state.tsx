import { FC } from "react";
import { Loader } from "@/components/loader-table";
import { NoDataFound } from "@/components/no-data-found";

interface TableDataStateProps {
  isLoading: boolean;
  loadingMessage?: string;
  noDataMessage?: string;
}

export const TableDataState: FC<TableDataStateProps> = ({
  isLoading,
}) => {
  return (
    <div className="w-full flex items-center justify-center">
      {isLoading ? (
        <Loader />
      ) : (
        <NoDataFound />
      )}
    </div>
  );
};
