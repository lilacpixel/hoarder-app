import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useAddBookmarkToList,
  useBookmarkLists,
  useRemoveBookmarkFromList,
} from "@hoarder/shared-react/hooks/lists";

import { BookmarkListSelector } from "../lists/BookmarkListSelector";

export default function ManageListsModal({
  bookmarkId,
  open,
  setOpen,
}: {
  bookmarkId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const formSchema = z.object({
    listId: z.string({
      required_error: "Please select a list",
    }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      listId: undefined,
    },
  });

  const { data: allLists } = useBookmarkLists(undefined, { enabled: open });

  const { data: alreadyInList } = api.lists.getListsOfBookmark.useQuery(
    {
      bookmarkId,
    },
    { enabled: open },
  );

  const { mutate: addToList, isPending: isAddingToListPending } =
    useAddBookmarkToList({
      onSuccess: () => {
        toast({
          description: "List has been updated!",
        });
        form.resetField("listId");
      },
      onError: (e) => {
        if (e.data?.code == "BAD_REQUEST") {
          toast({
            variant: "destructive",
            description: e.message,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Something went wrong",
          });
        }
      },
    });

  const { mutate: deleteFromList, isPending: isDeleteFromListPending } =
    useRemoveBookmarkFromList({
      onSuccess: () => {
        toast({
          description: "List has been updated!",
        });
        form.resetField("listId");
      },
      onError: (e) => {
        if (e.data?.code == "BAD_REQUEST") {
          toast({
            variant: "destructive",
            description: e.message,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Something went wrong",
          });
        }
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((value) => {
              addToList({
                bookmarkId: bookmarkId,
                listId: value.listId,
              });
            })}
          >
            <DialogHeader>
              <DialogTitle>Manage Lists</DialogTitle>
            </DialogHeader>
            {allLists && (
              <ul className="flex flex-col gap-2 pb-2 pt-4">
                {alreadyInList?.lists.map((list) => (
                  <li
                    key={list.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-2 py-1 text-foreground"
                  >
                    <p>
                      {allLists
                        .getPathById(list.id)!
                        .map((l) => `${l.icon} ${l.name}`)
                        .join(" / ")}
                    </p>
                    <ActionButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={isDeleteFromListPending}
                      onClick={() =>
                        deleteFromList({ bookmarkId, listId: list.id })
                      }
                    >
                      <X className="size-4" />
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}

            <div className="pb-4">
              <FormField
                control={form.control}
                name="listId"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <BookmarkListSelector
                          value={field.value}
                          hideBookmarkIds={alreadyInList?.lists.map(
                            (l) => l.id,
                          )}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <ActionButton
                type="submit"
                loading={isAddingToListPending}
                disabled={isAddingToListPending}
              >
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function useManageListsModal(bookmarkId: string) {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    content: (
      <ManageListsModal bookmarkId={bookmarkId} open={open} setOpen={setOpen} />
    ),
  };
}
