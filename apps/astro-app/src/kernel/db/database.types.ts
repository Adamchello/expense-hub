import type { CreateInsertType } from "@/types/utils";

type Bill = {
  id: string;
  user_id: string;
  profile_id: string;
  amount: number;
  date: string;
  provider_name: string;
  description: string | null;
  category: string;
  created_at: string;
};

type Profile = {
  id: string;
  account_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type AccountSettings = {
  account_id: string;
  active_profile_id: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      bills: {
        Row: Bill;
        Insert: CreateInsertType<Bill, "id" | "description" | "created_at">;
        Update: Partial<Bill>;
      };
      profiles: {
        Row: Profile;
        Insert: CreateInsertType<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Profile>;
      };
      account_settings: {
        Row: AccountSettings;
        Insert: CreateInsertType<
          AccountSettings,
          "updated_at" | "active_profile_id"
        >;
        Update: Partial<AccountSettings>;
      };
    };
  };
};
