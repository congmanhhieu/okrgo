import React from "react";

export type NotificationSubject = {
  id: number;
  name: string;
  avatar?: string;
};

export type NotificationObject = {
  id?: number;
  name: string;
  type: string;
};

export type NotificationData = {
  subject_count: number;
  subjects: NotificationSubject[];
  di_object?: NotificationObject;
  pr_object?: NotificationObject;
  in_object?: NotificationObject;
};

export type NotificationResponse = {
  id: number;
  company_id: number;
  user_id: number;
  group_key: string;
  type: string;
  data: NotificationData;
  url: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export const renderNotificationContent = (n: NotificationResponse): React.ReactNode => {
  const { type, data } = n;
  const { subjects, subject_count, di_object, pr_object } = data;

  if (!subjects || subjects.length === 0) return <span>Thông báo hệ thống</span>;

  const firstActor = subjects[0].name;
  const othersCount = subject_count - 1;

  const actorHtml = (
    <span className="font-semibold text-[#1E2A3A]">
      {firstActor} {othersCount > 0 ? `và ${othersCount} người khác` : ""}
    </span>
  );

  switch (type) {
    case "receive_feedback":
      return (
        <span>
          {actorHtml} đã gửi phản hồi cho bạn về <b>{di_object?.name || "mục tiêu"}</b>
        </span>
      );
    case "assign_task":
      return (
        <span>
          {actorHtml} đã giao cho bạn công việc <b>{di_object?.name || "chưa xác định"}</b>
        </span>
      );
    case "finish_task":
      return (
        <span>
          {actorHtml} đã đánh dấu hoàn thành công việc <b>{di_object?.name || "chưa xác định"}</b>
        </span>
      );
    case "receive_kudo":
      return (
        <span>
          {actorHtml} đã <span className="font-semibold text-[#F59E0B]">vinh danh</span> bạn {pr_object?.name ? `về ${pr_object.name}` : ""}
        </span>
      );
    case "checkin":
      return (
        <span>
          {actorHtml} đã báo cáo tiến độ (Check-in) cho KR: <b>{di_object?.name}</b>
        </span>
      );
    case "system_message":
      return (
        <span>
          <b>{firstActor}</b> vừa {di_object?.name}
        </span>
      );
    default:
      return (
        <span>
          {actorHtml} đã tương tác với <b>{di_object?.name}</b>
        </span>
      );
  }
};
