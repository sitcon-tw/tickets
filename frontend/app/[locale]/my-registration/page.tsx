"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { registrationsAPI, authAPI } from "@/lib/api/endpoints";
import { Registration } from "@/lib/types/api";
import { getTranslations } from "@/i18n/helpers";
import { useAlert } from "@/contexts/AlertContext";
import PageSpinner from "@/components/PageSpinner";
import { getLocalizedText } from "@/lib/utils/localization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Ticket, Eye, MapPin } from "lucide-react";

export default function MyRegistrationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const t = getTranslations(locale, {
    title: {
      "zh-Hant": "我的報名",
      "zh-Hans": "我的报名",
      en: "My Registrations",
    },
    noRegistrations: {
      "zh-Hant": "您還沒有任何報名記錄",
      "zh-Hans": "您还没有任何报名记录",
      en: "You don't have any registrations yet",
    },
    noFilteredRegistrations: {
      "zh-Hant": "沒有符合條件的報名記錄",
      "zh-Hans": "没有符合条件的报名记录",
      en: "No registrations match this filter",
    },
    loadError: {
      "zh-Hant": "載入報名資料時發生錯誤",
      "zh-Hans": "加载报名资料时发生错误",
      en: "Failed to load registrations",
    },
    upcoming: {
      "zh-Hant": "即將到來",
      "zh-Hans": "即将到来",
      en: "Upcoming",
    },
    past: {
      "zh-Hant": "已結束",
      "zh-Hans": "已结束",
      en: "Past",
    },
    all: {
      "zh-Hant": "全部",
      "zh-Hans": "全部",
      en: "All",
    },
    confirmed: {
      "zh-Hant": "已確認",
      "zh-Hans": "已确认",
      en: "Confirmed",
    },
    cancelled: {
      "zh-Hant": "已取消",
      "zh-Hans": "已取消",
      en: "Cancelled",
    },
    pending: {
      "zh-Hant": "待處理",
      "zh-Hans": "待处理",
      en: "Pending",
    },
    viewDetails: {
      "zh-Hant": "查看詳情",
      "zh-Hans": "查看详情",
      en: "View Details",
    },
    registeredOn: {
      "zh-Hant": "報名於",
      "zh-Hans": "报名于",
      en: "Registered on",
    },
  });

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);

        const session = await authAPI.getSession();
        if (!session || !session.user) {
          const returnUrl = encodeURIComponent(
            window.location.pathname + window.location.search
          );
          router.push(`/${locale}/login/?returnUrl=${returnUrl}`);
          return;
        }

        const response = await registrationsAPI.getAll();
        setRegistrations(response.data || []);
      } catch (error) {
        console.error("Error fetching registrations:", error);
        showAlert(t.loadError, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [locale, router, showAlert, t.loadError]);

  const handleViewDetails = (id: string) => {
    router.push(`/${locale}/my-registration/${id}?h`);
  };

  if (loading) {
    return <PageSpinner />;
  }

  const statusTranslations: Record<string, string> = {
    confirmed: t.confirmed,
    cancelled: t.cancelled,
    pending: t.pending,
  };

  const statusVariants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    confirmed: "default",
    cancelled: "destructive",
    pending: "secondary",
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "upcoming") return reg.isUpcoming;
    if (filter === "past") return reg.isPast;
    return true;
  });

  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const isSameDay = start.toDateString() === end.toDateString();

    if (isSameDay) {
      return {
        date: formatDate(start),
        time: `${formatTime(start)} - ${formatTime(end)}`,
      };
    }

    return {
      date: `${formatDate(start)} - ${formatDate(end)}`,
      time: `${formatTime(start)} - ${formatTime(end)}`,
    };
  };

  return (
    <div className="container mx-auto py-10 pt-32 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">{t.title}</h1>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            {t.all}
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("upcoming")}
          >
            {t.upcoming}
          </Button>
          <Button
            variant={filter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("past")}
          >
            {t.past}
          </Button>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">{t.noRegistrations}</p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {t.noFilteredRegistrations}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {filteredRegistrations.map((registration) => {
            const eventName = registration.event?.name
              ? getLocalizedText(registration.event.name, locale)
              : "Unknown Event";
            const ticketName = registration.ticket?.name
              ? getLocalizedText(registration.ticket.name, locale)
              : "Unknown Ticket";
            const location = registration.event?.location;
            const { date, time } =
              registration.event?.startDate && registration.event?.endDate
                ? formatEventDate(
                    registration.event.startDate,
                    registration.event.endDate
                  )
                : { date: "-", time: "-" };

            return (
              <Card
                key={registration.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Time Display */}
                    <div className="shrink-0 lg:w-64 bg-primary/5 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                      <Calendar className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-2xl font-bold mb-1">{date}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{time}</span>
                      </div>
                      {registration.isUpcoming && (
                        <Badge variant="outline" className="mt-3">
                          {t.upcoming}
                        </Badge>
                      )}
                      {registration.isPast && (
                        <Badge variant="secondary" className="mt-3">
                          {t.past}
                        </Badge>
                      )}
                    </div>

                    {/* Right: Event Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h2 className="text-2xl font-bold">{eventName}</h2>
                          <Badge
                            variant={
                              statusVariants[registration.status] || "default"
                            }
                          >
                            {statusTranslations[registration.status] ||
                              registration.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Ticket className="h-4 w-4" />
                            <span>{ticketName}</span>
                          </div>
                          {location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{location}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {t.registeredOn}{" "}
                          {new Date(registration.createdAt).toLocaleDateString(
                            locale,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleViewDetails(registration.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {t.viewDetails}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
