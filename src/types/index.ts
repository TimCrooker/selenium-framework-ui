export interface Bot {
  id: string;
  name: string;
  script: string;
  schedule?: string;
  status: string;
}

export interface Run {
  run_id: string;
  bot_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  logs?: string;
}
