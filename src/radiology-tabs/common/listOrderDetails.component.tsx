import React, { useMemo, useState } from "react";
import styles from "./listOrderDetails.scss";

import { useTranslation } from "react-i18next";
import {
  formatDate,
  openmrsFetch,
  parseDate,
  restBaseUrl,
  showModal,
  showSnackbar,
} from "@openmrs/esm-framework";
import { ListOrdersDetailsProps } from "./radiologyProps.resource";
import { launchOverlay } from "../../components/overlay/hook";
import ProcedureReportForm from "../../results/result-form.component";
import { Button, Tile } from "@carbon/react";
import { OrderDetail } from "./orderDetail.component";

// can render orders of a patient
const ListOrderDetails: React.FC<ListOrdersDetailsProps> = (props) => {
  const orders = props.groupedOrders?.orders;
  const { t } = useTranslation();
  const orderrows = useMemo(() => {
    return orders
      ?.filter((item) => item.action === "NEW")
      .map((entry) => ({
        ...entry,
        id: entry.uuid,
        orderNumber: entry.orderNumber,
        procedure: entry.display,
        status: entry.fulfillerStatus ? entry.fulfillerStatus : "--",
        urgency: entry.urgency,
        orderer: entry.orderer?.display,
        instructions: entry.instructions ? entry.instructions : "--",
        date: (
          <span className={styles["single-line-display"]}>
            {formatDate(parseDate(entry?.dateActivated))}
          </span>
        ),
      }));
  }, [orders]);

  const StartOrder = ({ order }) => {
    const [buttonStyle, setButtonStyle] = useState({
      backgroundColor: "#cccccc",
      width: "10%",
      height: "2%",
    });
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    const handleStartClick = async () => {
      const body = {
        fulfillerComment: "",
        fulfillerStatus: "IN_PROGRESS",
      };

      try {
        const response = await openmrsFetch(
          `${restBaseUrl}/order/${order.uuid}/fulfillerdetails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        if (response.status === 201) {
          // Check for successful POST
          showSnackbar({
            isLowContrast: true,
            title: t(
              "statusUpdatedSuccessfully",
              "Status updated successfully"
            ),
            kind: "success",
          });

          // Update button style on successful POST
          setButtonStyle({
            backgroundColor: "#90EE90",
            width: "10%",
            height: "2%",
          });

          setIsButtonDisabled(true);
        } else {
          const errorData = await response.json();
          showSnackbar({
            isLowContrast: true,
            title: t("errorUpdatingStatus", "Error updating status"),
            subtitle: t("failedtoupdatestatus", "Failed to Update the Status"),
            kind: "error",
          });
        }
      } catch (error) {
        showSnackbar({
          isLowContrast: true,
          title: t("errorUpdatingStatus", "Error updating status"),
          subtitle:
            t("failedtoupdatestatus", "Failed to Update the Status: ") +
            error.message,
          kind: "error",
        });
      }
    };

    return (
      <div>
        <Button
          kind="primary"
          size="small"
          onClick={handleStartClick}
          style={buttonStyle}
          disabled={isButtonDisabled} // Set the button's disabled status
        >
          START
        </Button>
      </div>
    );
  };

  return (
    <div className={styles.ordersContainer}>
      {orderrows.map((row) => (
        <Tile className={styles.orderTile}>
          {props.showActions && (
            <div className={styles.actionBtns}>
              {props.actions
                .sort((a, b) => {
                  // Replace 'property' with the actual property you want to sort by
                  if (a.displayPosition < b.displayPosition) return -1;
                  if (a.displayPosition > b.displayPosition) return 1;
                  return 0;
                })
                .map((action) => {
                  if (
                    action.actionName === "add-radiology-to-worklist-dialog"
                  ) {
                    return (
                      <Button
                        kind="primary"
                        onClick={() => {
                          const dispose = showModal(
                            "add-radiology-to-worklist-dialog",
                            {
                              closeModal: () => dispose(),
                              order: orders.find(
                                (order) => order.uuid == row.id
                              ),
                            }
                          );
                        }}
                      >
                        {t("picklabrequest", "Pick Lab Request")}
                      </Button>
                    );
                  }
                  if (action.actionName === "procedureReportForm") {
                    return (
                      <Button
                        kind="primary"
                        onClick={() => {
                          launchOverlay(
                            t("procedureReportForm", "Procedure report form"),
                            <ProcedureReportForm
                              patientUuid={row.patient.uuid}
                              order={orders.find(
                                (order) => order.uuid == row.id
                              )}
                            />
                          );
                        }}
                      >
                        {t("procedurereportform", "Procedure Report Form")}
                      </Button>
                    );
                  }
                  if (action.actionName === "review-radilogy-report-dialog") {
                    return (
                      <Button
                        kind="tertiary"
                        onClick={() => {
                          const dispose = showModal(
                            "review-radilogy-report-dialog",
                            {
                              closeModal: () => dispose(),
                              order: orders.find(
                                (order) => order.uuid == row.id
                              ),
                            }
                          );
                        }}
                      >
                        {t("reviewradiologyreport", "Review Radiology Report")}
                      </Button>
                    );
                  }
                  if (action.actionName === "radiology-reject-reason-modal") {
                    return (
                      <Button
                        kind="tertiary"
                        onClick={() => {
                          const dispose = showModal(
                            "radiology-reject-reason-modal",
                            {
                              closeModal: () => dispose(),
                              order: orders.find(
                                (order) => order.uuid == row.id
                              ),
                            }
                          );
                        }}
                      >
                        {t("rejectreason", "Reject Reason")}
                      </Button>
                    );
                  }
                  if (action.actionName === "reject-radiology-order-dialog") {
                    return (
                      <Button
                        kind="danger"
                        onClick={() => {
                          const dispose = showModal(
                            "reject-radiology-order-dialog",
                            {
                              closeModal: () => dispose(),
                              order: orders.find(
                                (order) => order.uuid == row.id
                              ),
                            }
                          );
                        }}
                      >
                        {t("rejectorder", "Reject Order")}
                      </Button>
                    );
                  }
                })}
            </div>
          )}
          <div>
            <OrderDetail
              label={t("date", "DATE").toUpperCase()}
              value={row.date}
            />
            <OrderDetail
              label={t("orderNumber", "Order Number").toUpperCase()}
              value={row.orderNumber}
            />
            <OrderDetail
              label={t("procedure", "procedure").toUpperCase()}
              value={row.procedure}
            />

            {props.showStatus && (
              <OrderDetail
                label={t("status", "Status").toUpperCase()}
                value={row.status}
              />
            )}
            <OrderDetail
              label={t("urgency", "urgency").toUpperCase()}
              value={row.urgency}
            />
            <OrderDetail
              label={t("orderer", "orderer").toUpperCase()}
              value={row.orderer}
            />
            <OrderDetail
              label={t("instructions", "Instructions").toUpperCase()}
              value={row.instructions}
            />

            {props.showStartButton && (
              <div>
                <StartOrder order={row} />
              </div>
            )}
          </div>
        </Tile>
      ))}
    </div>
  );
};

export default ListOrderDetails;
