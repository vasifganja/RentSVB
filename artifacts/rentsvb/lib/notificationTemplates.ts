export function getOwnerAcceptedNotification() {
  return {
    type: "owner_accepted",

    title_az: "Sorğunuz qəbul edildi",
    title_en: "Your request was accepted",
    title_ru: "Ваш запрос принят",

    body_az: "Ev sahibi icarə sorğunuzu qəbul etdi.",
    body_en: "The owner accepted your rental request.",
    body_ru: "Владелец принял ваш запрос на аренду.",
  };
}

export function getOwnerCompletedNotification() {
  return {
    type: "owner_completed",

    title_az: "İcarə tamamlandı",
    title_en: "Rental completed",
    title_ru: "Аренда завершена",

    body_az: "Ev sahibi icarəni tamamladı. Zəhmət olmasa təsdiqləyin.",
    body_en: "The owner completed the rental. Please confirm.",
    body_ru: "Владелец завершил аренду. Пожалуйста, подтвердите.",
  };
}

export function getTenantConfirmedNotification() {
  return {
    type: "tenant_confirmed",

    title_az: "İcarə təsdiqləndi",
    title_en: "Rental confirmed",
    title_ru: "Аренда подтверждена",

    body_az: "İcarə kirayəçi tərəfindən təsdiqləndi.",
    body_en: "The rental has been confirmed by the tenant.",
    body_ru: "Аренда подтверждена арендатором.",
  };
}

export function getRentalCompletedNotification() {
  return {
    
    type: "rental_completed",

    title_az: "İcarə tamamlandı",
    title_en: "Rental completed",
    title_ru: "Аренда завершена",

    body_az: "İcarə uğurla tamamlandı.",
    body_en: "The rental has been completed successfully.",
    body_ru: "Аренда успешно завершена.",
  };
}

export function getOwnerRentalCompletedNotification() {
  return {
    type: "rental_completed",

    title_az: "İcarə tamamlandı",
    title_en: "Rental completed",
    title_ru: "Аренда завершена",

    body_az: "İcarə uğurla tamamlandı. Əmlak yenidən əlçatandır.",
    body_en: "The rental has been completed successfully. The property is available again.",
    body_ru: "Аренда успешно завершена. Объект снова доступен.",
  };
}

export function getRentalCancelledNotification() {
  return {
    type: "rental_cancelled",

    title_az: "İcarə ləğv edildi",
    title_en: "Rental cancelled",
    title_ru: "Аренда отменена",

    body_az: "İcarə ləğv edildi.",
    body_en: "The rental has been cancelled.",
    body_ru: "Аренда была отменена.",
  };
}

export function getOwnerRentalCancelledNotification() {
  return {
    type: "rental_cancelled",

    title_az: "İcarə ləğv edildi",
    title_en: "Rental cancelled",
    title_ru: "Аренда отменена",

    body_az: "İcarə ləğv edildi. Əmlak yenidən əlçatandır.",
    body_en: "The rental has been cancelled. The property is available again.",
    body_ru: "Аренда была отменена. Объект снова доступен.",
  };
}

export function getRequestAcceptedNotification() {
  return {
    type: "request_accepted",

    title_az: "Sorğunuz qəbul edildi",
    title_en: "Your request has been accepted",
    title_ru: "Ваш запрос принят",

    body_az: "Ev sahibi kirayə sorğunuzu qəbul etdi.",
    body_en: "The owner has accepted your rental request.",
    body_ru: "Владелец принял ваш запрос на аренду.",
  };
}

export function getRequestRejectedNotification() {
  return {
    type: "request_rejected",

    title_az: "Sorğunuz rədd edildi",
    title_en: "Your request has been rejected",
    title_ru: "Ваш запрос отклонён",

    body_az: "Ev sahibi kirayə sorğunuzu rədd etdi.",
    body_en: "The owner has rejected your rental request.",
    body_ru: "Владелец отклонил ваш запрос на аренду.",
  };
}