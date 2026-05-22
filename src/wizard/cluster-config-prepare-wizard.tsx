import React from "react";
import {
  Modal,
  Wizard,
  WizardStep,
  Title,
  Content,
  Form,
  FormGroup,
  Radio,
  Switch,
  TextInput,
  TextArea,
  FileUpload,
  Button,
  Label,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import { CheckCircleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import ValidationErrorModal from "../components/common/ValidationErrorModal";
import "./cluster-config-prepare-wizard.scss";
import {
  duplicateMessage,
  firstError,
  isHostAddress,
  isIntegerInRange,
  isIpv4,
  optionalIpv4,
  requireClusterJsonFileName,
  requireFileName,
  requireHostname,
  requireIpv4,
  requireValue,
} from "./validation";

type ClusterType = "ablestack-hci" | "ablestack-vm" | "ablestack-standalone" | "ablestack-hci-filesystem";
type RadioValue = "new" | "existing";
type HostMode = "new" | "add";
type TimeServerType = "internal" | "external";
type HostRole = "master" | "second" | "other";

interface ClusterHostRow {
  hostName: string;
  hostIp: string;
  storageIp: string;
  scvmMgmtIp: string;
  hostPnIp: string;
  scvmPnIp: string;
  scvmCnIp: string;
}

interface ClusterConfigPrepareWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOSTS: ClusterHostRow[] = [
  {
    hostName: "ablecube32-1",
    hostIp: "10.10.32.1",
    storageIp: "100.100.32.1",
    scvmMgmtIp: "10.10.32.11",
    hostPnIp: "100.100.32.1",
    scvmPnIp: "100.100.32.11",
    scvmCnIp: "100.200.32.11",
  },
  {
    hostName: "ablecube32-2",
    hostIp: "10.10.32.2",
    storageIp: "100.100.32.2",
    scvmMgmtIp: "10.10.32.12",
    hostPnIp: "100.100.32.2",
    scvmPnIp: "100.100.32.12",
    scvmCnIp: "100.200.32.12",
  },
  {
    hostName: "ablecube32-3",
    hostIp: "10.10.32.3",
    storageIp: "100.100.32.3",
    scvmMgmtIp: "10.10.32.13",
    hostPnIp: "100.100.32.3",
    scvmPnIp: "100.100.32.13",
    scvmCnIp: "100.200.32.13",
  },
];

export default function ClusterConfigPrepareWizardModal({
  isOpen,
  onClose,
}: ClusterConfigPrepareWizardModalProps) {
  const [clusterType, setClusterType] = React.useState<ClusterType>("ablestack-hci");
  const [sshKeyMode, setSshKeyMode] = React.useState<RadioValue>("new");
  const [clusterHostMode, setClusterHostMode] = React.useState<HostMode>("new");
  const [hostsFileMode, setHostsFileMode] = React.useState<RadioValue>("new");
  const [hosts, setHosts] = React.useState<ClusterHostRow[]>(DEFAULT_HOSTS);
  const [hostCount, setHostCount] = React.useState(3);
  const [isIscsiExclusive, setIsIscsiExclusive] = React.useState(false);
  const [currentHostname, setCurrentHostname] = React.useState("ablecube32-1");
  const [ccvmMgmtIp, setCcvmMgmtIp] = React.useState("10.10.32.10");
  const [mgmtCidr, setMgmtCidr] = React.useState("16");
  const [mgmtGateway, setMgmtGateway] = React.useState("10.10.0.1");
  const [mgmtDns, setMgmtDns] = React.useState("8.8.8.8");
  const [pcsPnIp1, setPcsPnIp1] = React.useState("100.100.32.1");
  const [pcsPnIp2, setPcsPnIp2] = React.useState("100.100.32.2");
  const [pcsPnIp3, setPcsPnIp3] = React.useState("100.100.32.3");
  const [hostsFileText, setHostsFileText] = React.useState("");
  const [sshPrivateText, setSshPrivateText] = React.useState("");
  const [sshPublicText, setSshPublicText] = React.useState("");
  const [sshPrivateFilename, setSshPrivateFilename] = React.useState("");
  const [sshPublicFilename, setSshPublicFilename] = React.useState("");
  const [hostsFilename, setHostsFilename] = React.useState("");
  const [timeServerType, setTimeServerType] = React.useState<TimeServerType>("internal");
  const [hostRole, setHostRole] = React.useState<HostRole>("master");
  const [externalTimeServer, setExternalTimeServer] = React.useState("time.google.com");
  const [timeServer1, setTimeServer1] = React.useState("100.100.33.1");
  const [timeServer2, setTimeServer2] = React.useState("100.100.33.2");
  const [ipmiIp, setIpmiIp] = React.useState("");
  const [ipmiUser, setIpmiUser] = React.useState("");
  const [ipmiPassword, setIpmiPassword] = React.useState("");
  const [reviewOpen, setReviewOpen] = React.useState({
    clusterType: true,
    sshKey: true,
    clusterConfig: true,
    timeServer: true,
  });
  const [validationMessage, setValidationMessage] = React.useState("");

  const resetState = React.useCallback(() => {
    setClusterType("ablestack-hci");
    setSshKeyMode("new");
    setClusterHostMode("new");
    setHostsFileMode("new");
    setHosts(DEFAULT_HOSTS);
    setHostCount(3);
    setIsIscsiExclusive(false);
    setCurrentHostname("ablecube32-1");
    setCcvmMgmtIp("10.10.32.10");
    setMgmtCidr("16");
    setMgmtGateway("10.10.0.1");
    setMgmtDns("8.8.8.8");
    setPcsPnIp1("100.100.32.1");
    setPcsPnIp2("100.100.32.2");
    setPcsPnIp3("100.100.32.3");
    setHostsFileText("");
    setSshPrivateText("");
    setSshPublicText("");
    setSshPrivateFilename("");
    setSshPublicFilename("");
    setHostsFilename("");
    setTimeServerType("internal");
    setHostRole("master");
    setExternalTimeServer("time.google.com");
    setTimeServer1("100.100.33.1");
    setTimeServer2("100.100.33.2");
    setIpmiIp("");
    setIpmiUser("");
    setIpmiPassword("");
    setValidationMessage("");
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  React.useEffect(() => {
    if (clusterType === "ablestack-standalone") {
      setClusterHostMode("new");
      setHostsFileMode("new");
      setIsIscsiExclusive(false);
      updateHostCount(1);
      return;
    }

    if (clusterType === "ablestack-vm") {
      updateHostCount(1);
      return;
    }

    setIsIscsiExclusive(false);
    updateHostCount(Math.max(3, hostCount));
  // hostCount 변경까지 의존성에 포함하면 사용자가 +/- 조작 시 다시 보정되어 불편해지므로 clusterType 변화에만 반응합니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterType]);

  const updateHostCount = (nextCount: number) => {
    const minCount = clusterType === "ablestack-hci" || clusterType === "ablestack-hci-filesystem" ? 3 : 1;
    const maxCount = clusterType === "ablestack-standalone" ? 1 : 99;
    const safeCount = Math.max(minCount, Math.min(maxCount, nextCount));
    setHostCount(safeCount);
    setHosts((prev) => {
      if (safeCount === prev.length) return prev;
      if (safeCount < prev.length) return prev.slice(0, safeCount);
      const extras = Array.from({ length: safeCount - prev.length }, (_, idx) => ({
        hostName: `ablecube32-${prev.length + idx + 1}`,
        hostIp: "",
        storageIp: "",
        scvmMgmtIp: "",
        hostPnIp: "",
        scvmPnIp: "",
        scvmCnIp: "",
      }));
      return [...prev, ...extras];
    });
  };

  const updateHost = (index: number, key: keyof ClusterHostRow, value: string) => {
    setHosts((prev) => prev.map((host, hostIndex) => (
      hostIndex === index ? { ...host, [key]: value } : host
    )));
  };

  const readTextFile = (
    file: File,
    setFilename: (filename: string) => void,
    setText: (text: string) => void
  ) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  };

  const renderClusterTypeCard = (
    value: ClusterType,
    title: string,
    description: string
  ) => (
    <button
      type="button"
      className={
        clusterType === value
          ? "ct-cluster-config-wizard__type-card ct-cluster-config-wizard__type-card--active"
          : "ct-cluster-config-wizard__type-card"
      }
      onClick={() => setClusterType(value)}
    >
      <div className="ct-cluster-config-wizard__type-card-title">{title}</div>
      <div className="ct-cluster-config-wizard__type-card-desc">{description}</div>
      {clusterType === value && (
        <div className="ct-cluster-config-wizard__type-card-check">
          <CheckCircleIcon aria-hidden="true" />
        </div>
      )}
    </button>
  );

  const clusterTypeLabel =
    clusterType === "ablestack-hci"
      ? "ABLESTACK-HCI"
      : clusterType === "ablestack-vm"
        ? "ABLESTACK-VM"
        : clusterType === "ablestack-standalone"
          ? "ABLESTACK-STANDALONE"
          : "ABLESTACK-HCI-Filesystem";

  const sshKeyModeLabel = sshKeyMode === "new" ? "신규 생성" : "기존 파일 사용";
  const hostsFileModeLabel = hostsFileMode === "new" ? "신규 생성" : "기존 파일 사용";
  const timeServerTypeLabel = timeServerType === "internal" ? "로컬 시간서버" : "외부 시간서버";
  const hostRoleLabel =
    hostRole === "master" ? "Master Server" : hostRole === "second" ? "Second Server" : "Other Server";
  const isVmLikeCluster = clusterType === "ablestack-vm" || clusterType === "ablestack-standalone";
  const isStandalone = clusterType === "ablestack-standalone";
  const isVmAddHost = clusterType === "ablestack-vm" && clusterHostMode === "add";
  const canUseAddHost = !isStandalone;
  const visibleHosts = hosts.slice(0, hostCount);

  const buildHostsPreview = () => {
    if (hostsFileText.trim()) return hostsFileText;
    const lines: string[] = [];
    if (!isVmAddHost && ccvmMgmtIp) {
      lines.push(`${ccvmMgmtIp}\tccvm-mngt\tccvm`);
    }
    visibleHosts.forEach((row, index) => {
      const idx = index + 1;
      if (isVmLikeCluster) {
        lines.push(`${row.hostIp}\t${row.hostName}\tablecube`);
        if (clusterType === "ablestack-vm" && isIscsiExclusive && row.storageIp) {
          lines.push(`${row.storageIp}\tpn-ablecube\tpn-ablecube`);
        }
        return;
      }

      lines.push(`${row.hostIp}\t${row.hostName}${row.hostName === currentHostname ? "\tablecube" : ""}`);
      lines.push(`${row.scvmMgmtIp}\tscvm${idx}-mngt${row.hostName === currentHostname ? "\tscvm-mngt" : ""}`);
      lines.push(`${row.hostPnIp}\tpn-ablecube${idx}${row.hostName === currentHostname ? "\tpn-ablecube" : ""}`);
      lines.push(`${row.scvmPnIp}\tscvm${idx}${row.hostName === currentHostname ? "\tscvm" : ""}`);
      lines.push(`${row.scvmCnIp}\tcn-scvm${idx}${row.hostName === currentHostname ? "\tcn-scvm" : ""}`);
    });
    return lines.join("\n");
  };

  const buildClusterJsonPreview = () => JSON.stringify({
    clusterConfig: {
      type: clusterType,
      hostType: clusterHostMode,
      iscsiStorageExclusive: clusterType === "ablestack-vm" ? isIscsiExclusive : false,
      ccvm: isVmAddHost ? undefined : { ip: ccvmMgmtIp },
      mngtNic: isVmAddHost ? undefined : {
        cidr: mgmtCidr,
        gw: mgmtGateway,
        dns: mgmtDns,
      },
      pcsCluster: isVmLikeCluster ? undefined : {
        hostname1: pcsPnIp1,
        hostname2: pcsPnIp2,
        hostname3: pcsPnIp3,
      },
      hosts: visibleHosts.map((host, index) => ({
        index: String(index + 1),
        hostname: host.hostName,
        ablecube: host.hostIp,
        ...(clusterType === "ablestack-vm" && isIscsiExclusive ? { ablecubePn: host.storageIp } : {}),
        ...(!isVmLikeCluster ? {
          scvmMngt: host.scvmMgmtIp,
          ablecubePn: host.hostPnIp,
          scvm: host.scvmPnIp,
          scvmCn: host.scvmCnIp,
        } : {}),
      })),
      extenal_timeserver: externalTimeServer,
      timeServers: [timeServer1, timeServer2].filter(Boolean),
      ...(isVmAddHost ? {
        ipmi: {
          ip: ipmiIp,
          port: "623",
          user: ipmiUser,
        },
      } : {}),
    },
  }, null, 2);

  const downloadHref = (content: string) => `data:attachment/text;charset=utf-8,${encodeURIComponent(content)}`;

  const validateClusterConfigPrepare = () => {
    if (sshKeyMode === "existing") {
      const privateKeyMessage = firstError(
        requireFileName(sshPrivateFilename, "id_rsa", "'id_rsa'으로 된 개인 키 파일만 업로드할 수 있습니다."),
        requireValue(sshPrivateText, "SSH 개인 키 파일 정보를 확인해 주세요.")
      );
      if (privateKeyMessage) return privateKeyMessage;
      const publicKeyMessage = firstError(
        requireFileName(sshPublicFilename, "id_rsa.pub", "'id_rsa.pub'으로 된 공개 키 파일만 업로드할 수 있습니다."),
        requireValue(sshPublicText, "SSH 공개 키 파일 정보를 확인해 주세요.")
      );
      if (publicKeyMessage) return publicKeyMessage;
    }

    if (hostsFileMode === "existing") {
      const hostsFileMessage = firstError(
        requireClusterJsonFileName(hostsFilename),
        requireValue(hostsFileText, "클러스터 구성 프로파일 정보를 확인해 주세요.")
      );
      if (hostsFileMessage) return hostsFileMessage;
    }

    if (!clusterType) return "OS Type을 선택해주세요.";
    if (!isIntegerInRange(hostCount, isVmLikeCluster || isStandalone ? 1 : 3, isStandalone ? 1 : 99)) {
      return isStandalone ? "단일 구성은 호스트 수가 1대여야 합니다." : "구성할 호스트 수는 3~99 범위로 입력해주세요.";
    }

    if (hostsFileMode === "new") {
      for (let index = 0; index < visibleHosts.length; index += 1) {
        const row = visibleHosts[index];
        const hostLabel = `${index + 1}번 호스트`;
        const hostNameMessage = requireHostname(row.hostName, `${hostLabel} 호스트명`);
        if (hostNameMessage) return hostNameMessage;
        if (!isIpv4(row.hostIp)) return `${hostLabel} 호스트 IP 형식을 확인해주세요.`;

        if (clusterType === "ablestack-vm" && isIscsiExclusive && !isIpv4(row.storageIp)) {
          return `${hostLabel} 스토리지 전용 IP 형식을 확인해주세요.`;
        }

        if (!isVmLikeCluster) {
          if (!isIpv4(row.scvmMgmtIp)) return `${hostLabel} SCVM MNGT IP 형식을 확인해주세요.`;
          if (!isIpv4(row.hostPnIp)) return `${hostLabel} 호스트 PN IP 형식을 확인해주세요.`;
          if (!isIpv4(row.scvmPnIp)) return `${hostLabel} SCVM PN IP 형식을 확인해주세요.`;
          if (!isIpv4(row.scvmCnIp)) return `${hostLabel} SCVM CN IP 형식을 확인해주세요.`;
        }
      }
    }

    if (!isVmAddHost) {
      const ccvmMessage = requireIpv4(ccvmMgmtIp, "CCVM 관리 IP");
      if (ccvmMessage) return ccvmMessage;
      if (!isIntegerInRange(mgmtCidr, 0, 32)) return "관리 NIC CIDR 범위는 0~32 입니다.";
      const gatewayMessage = optionalIpv4(mgmtGateway, "관리 NIC Gateway");
      if (gatewayMessage) return gatewayMessage;
      const dnsMessage = optionalIpv4(mgmtDns, "관리 NIC DNS");
      if (dnsMessage) return dnsMessage;
    }

    if (!isVmLikeCluster) {
      const pcsMessages = [
        requireIpv4(pcsPnIp1, "PCS 호스트1 PN IP"),
        requireIpv4(pcsPnIp2, "PCS 호스트2 PN IP"),
        requireIpv4(pcsPnIp3, "PCS 호스트3 PN IP"),
      ];
      const pcsMessage = pcsMessages.find(Boolean);
      if (pcsMessage) return pcsMessage;
      const duplicatePcsMessage = duplicateMessage([pcsPnIp1, pcsPnIp2, pcsPnIp3], "중복된 PCS 호스트 PN IP가 존재합니다.");
      if (duplicatePcsMessage) return duplicatePcsMessage;
    }

    if (isVmAddHost) {
      const ipmiMessage = firstError(
        requireIpv4(ipmiIp, "IPMI IP"),
        requireValue(ipmiUser, "IPMI User를 입력해주세요."),
        requireValue(ipmiPassword, "IPMI Password를 입력해주세요.")
      );
      if (ipmiMessage) return ipmiMessage;
    }

    if (timeServerType === "external") {
      if (!externalTimeServer.trim()) return "외부 시간서버를 입력해주세요.";
      if (!isHostAddress(externalTimeServer)) return "외부 시간서버 형식을 확인해주세요.";
    } else {
      if (!timeServer1.trim()) return "시간 서버 1번 IP 정보를 확인해 주세요.";
      if (!isHostAddress(timeServer1)) return "시간 서버 1번 IP 정보를 확인해 주세요.";
      if (timeServer2.trim() && !isHostAddress(timeServer2)) return "시간 서버 2번 IP 정보를 확인해 주세요.";
    }

    if (hostsFileMode === "new") {
      const profileIps = visibleHosts.flatMap((row) => [
        row.hostIp,
        clusterType === "ablestack-vm" && isIscsiExclusive ? row.storageIp : "",
        !isVmLikeCluster ? row.scvmMgmtIp : "",
        !isVmLikeCluster ? row.hostPnIp : "",
        !isVmLikeCluster ? row.scvmPnIp : "",
        !isVmLikeCluster ? row.scvmCnIp : "",
      ]);
      const duplicateProfileMessage = duplicateMessage(profileIps, "클러스터 구성 프로파일에 중복된 IP가 존재합니다.");
      if (duplicateProfileMessage) return duplicateProfileMessage;
    }

    return "";
  };

  const wizardFooter = (activeStep: any, goToNextStep: () => void, goToPrevStep: () => void, close: () => void) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "cluster-config-overview";
    const isReview = stepId === "cluster-config-review";
    const isFinish = stepId === "cluster-config-complete";
    return (
      <div className="ct-cluster-config-wizard__footer">
        {!isFinish && (
          <Button
            variant="primary"
            onClick={() => {
              if (isReview) {
                const message = validateClusterConfigPrepare();
                if (message) {
                  setValidationMessage(message);
                  return;
                }
                setValidationMessage("");
              }
              goToNextStep();
            }}
          >
            {isReview ? "완료" : "다음"}
          </Button>
        )}
        {!isFirst && !isFinish && (
          <Button variant="secondary" onClick={goToPrevStep}>
            이전
          </Button>
        )}
        {!isFinish && (
          <Button variant="link" onClick={close}>
            취소
          </Button>
        )}
        {isFinish && (
          <Button variant="primary" onClick={close}>
            닫기
          </Button>
        )}
      </div>
    );
  };

  const renderHostTable = () => (
    <div className="ct-cluster-config-wizard__table-wrap">
      <div className="ct-cluster-config-wizard__table-title">클러스터 구성 프로파일</div>
      <table className="ct-cluster-config-wizard__table">
        <thead>
          <tr>
            <th>순번</th>
            <th>호스트명</th>
            <th>호스트 IP</th>
            {clusterType === "ablestack-vm" && isIscsiExclusive && <th>스토리지 전용 IP</th>}
            {!isVmLikeCluster && (
              <>
                <th>SCVM<br />MNGT IP</th>
                <th>호스트 PN IP</th>
                <th>SCVM PN IP</th>
                <th>SCVM CN IP</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleHosts.map((row, idx) => (
            <tr key={`cluster-host-row-${idx}`}>
              <td>{idx + 1}</td>
              <td>
                <TextInput
                  aria-label={`호스트명 ${idx + 1}`}
                  value={row.hostName}
                  onChange={(_event, value) => updateHost(idx, "hostName", value)}
                />
              </td>
              <td>
                <TextInput
                  aria-label={`호스트 IP ${idx + 1}`}
                  value={row.hostIp}
                  onChange={(_event, value) => updateHost(idx, "hostIp", value)}
                />
              </td>
              {clusterType === "ablestack-vm" && isIscsiExclusive && (
                <td>
                  <TextInput
                    aria-label={`스토리지 전용 IP ${idx + 1}`}
                    value={row.storageIp}
                    onChange={(_event, value) => updateHost(idx, "storageIp", value)}
                  />
                </td>
              )}
              {!isVmLikeCluster && (
                <>
                  <td>
                    <TextInput
                      aria-label={`SCVM MNGT IP ${idx + 1}`}
                      value={row.scvmMgmtIp}
                      onChange={(_event, value) => updateHost(idx, "scvmMgmtIp", value)}
                    />
                  </td>
                  <td>
                    <TextInput
                      aria-label={`호스트 PN IP ${idx + 1}`}
                      value={row.hostPnIp}
                      onChange={(_event, value) => updateHost(idx, "hostPnIp", value)}
                    />
                  </td>
                  <td>
                    <TextInput
                      aria-label={`SCVM PN IP ${idx + 1}`}
                      value={row.scvmPnIp}
                      onChange={(_event, value) => updateHost(idx, "scvmPnIp", value)}
                    />
                  </td>
                  <td>
                    <TextInput
                      aria-label={`SCVM CN IP ${idx + 1}`}
                      value={row.scvmCnIp}
                      onChange={(_event, value) => updateHost(idx, "scvmCnIp", value)}
                    />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        // onClose={handleClose}
        variant="large"
        aria-label="클러스터 구성 준비 마법사"
        className="ct-cluster-config-wizard__modal"
      >
      <Wizard
        onClose={handleClose}
        onSave={handleClose}
        width="100%"
        navAriaLabel="클러스터 구성 준비 단계"
        className="ct-cluster-config-wizard"
        footer={wizardFooter}
        header={
          <div className="ct-cluster-config-wizard__header">
            <div>
              <Title headingLevel="h1" size="2xl" className="ct-cluster-config-wizard__title">
                클러스터 구성 준비 마법사
              </Title>
            <Content className="ct-cluster-config-wizard__subtitle">
              <Content component="p">
                스토리지센터 및 클라우드센터 클러스터를 구성하기 위해 필요한 다양한 정보 및 구성파일을 준비합니다.
              </Content>
            </Content>
            </div>
            <button
              type="button"
              className="ct-cluster-config-wizard__close"
              aria-label="Close"
              onClick={handleClose}
            >
              ×
            </button>
          </div>
        }
      >
        <WizardStep name="개요" id="cluster-config-overview">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터 구성 준비 마법사는 클러스터를 자동으로 구성하고, 스토리지센터 및 클라우드센터를 구성하기 위해 필요한 다음의 정보를 입력받아 준비합니다.
              </Content>
              <Content component="ul">
                <Content component="li">HCI를 이용한 가상화 또는 서버 가상화를 사용하기 위한 클러스터 또는 로컬 스토리지를 사용하는 단일 서버 구성</Content>
                <Content component="li">모든 호스트 및 가상머신에서 사용자 인증을 위해 공통으로 사용할 SSH Key 정보</Content>
                <Content component="li">클러스터 또는 단일 노드를 구성하는 호스트 및 가상머신들의 호스트명 및 IP 정보</Content>
                <Content component="li">호스트 및 가상머신의 시간 동기화를 위한 시간서버</Content>
              </Content>
              <Content component="p">
                필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 클러스터 구성
                준비를 시작합니다.
              </Content>
            </Content>
          </div>
        </WizardStep>

        <WizardStep name="클러스터 종류" id="cluster-config-cluster-type">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                ABLESTACK은 고성능 컴퓨팅과 안정적인 가상화 환경을 제공합니다. 사용자는 하이퍼 컨버지드
                인프라(HCI)와 서버 가상화, 그리고 단일 로컬 구성 옵션 중에서 필요에 맞는 솔루션을 선택할 수 있습니다.
              </Content>
              <Content component="ul">
                <Content component="li">
                  ABLESTACK HCI는 데이터의 안정적이고 효율적인 관리를 위해 설계되었습니다. Glue 스토리지는
                  데이터를 여러 위치에 분산시켜 저장하여 높은 가용성과 확장성을 제공합니다.
                </Content>
                <Content component="li">
                  ABLESTACK VM은 물리적 하드웨어를 추상화하여 여러 가상 머신에서 동시 실행이 가능하게 하며,
                  자원의 효율적인 사용과 유연한 시스템 관리를 지원합니다.
                </Content>
                <Content component="li">
                  ABLESTACK STANDALONE은 단일 서버에 로컬 스토리지를 활용해 가상화 환경을 구성할 수 있는 옵션입니다.
                </Content>
                <Content component="li">
                  ABLESTACK HCI Filesystem은 Glue 스토리지에서 생성한 RBD 이미지를 기반으로 GFS2 클러스터 파일시스템을 구성해,
                  여러 호스트가 동일 볼륨을 동시에 마운트하는 공유 스토리지 환경을 제공합니다.
                </Content>
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__type-grid">
              {renderClusterTypeCard(
                "ablestack-hci",
                "ABLESTACK-HCI",
                "x86 기반의 서버와 가상화 기술, 그리고 소프트웨어 정의 기술을 접목하여 HCI를 구성하는 소프트웨어 스택입니다."
              )}
              {renderClusterTypeCard(
                "ablestack-vm",
                "ABLESTACK-VM",
                "Cube 및 외부 스토리지를 사용하여 Mold를 ABLESTACK VM으로 올린 소프트웨어 솔루션입니다."
              )}
              {renderClusterTypeCard(
                "ablestack-standalone",
                "ABLESTACK-STANDALONE",
                "단일 서버 환경에서 로컬 스토리지를 기반으로 ABLESTACK 제품을 구동하는 소프트웨어 솔루션입니다."
              )}
              {renderClusterTypeCard(
                "ablestack-hci-filesystem",
                "ABLESTACK-HCI-Filesystem",
                "내부 스토리지(Glue)를 기반으로 공유 파일 환경을 구성하는 ABLESTACK HCI용 소프트웨어 솔루션입니다."
              )}
            </div>
          </div>
        </WizardStep>

        <WizardStep name="SSH Key 파일" id="cluster-config-ssh-key">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터를 구성하는 호스트 및 가상머신은 모든 명령을 SSH를 이용해 암호화 하여 전달합니다.
                원활한 SSH 연결 및 상호 인증을 위해 동일한 SSH Key 설정이 필요합니다.
                마법사를 통해 새로운 SSH Key를 생성하여 사용하거나 기존의 SSH Key 파일을 사용할 수 있습니다.
                클러스터 호스트 구분이 추가 호스트인 경우 반드시 기존 SSH Key 파일을 사용해 주세요.
              </Content>
            </Content>
            <Form className="ct-cluster-config-wizard__section ct-cluster-config-wizard__form-horizontal" isHorizontal>
              <FormGroup label="SSH Key 준비 방법" isRequired fieldId="ssh-key-mode">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="ssh-key-new"
                    name="ssh-key-mode"
                    label="신규 생성"
                    isChecked={sshKeyMode === "new"}
                    onChange={() => setSshKeyMode("new")}
                  />
                  <Radio
                    id="ssh-key-existing"
                    name="ssh-key-mode"
                    label="기존 파일 사용"
                    isChecked={sshKeyMode === "existing"}
                    onChange={() => setSshKeyMode("existing")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="SSH 개인 키 파일" isRequired fieldId="ssh-private-key">
                <FileUpload
                  id="ssh-private-key-file"
                  type="text"
                  value=""
                  filename={sshPrivateFilename}
                  filenamePlaceholder="선택된 파일 없음"
                  onFileInputChange={(_, file) => readTextFile(file, setSshPrivateFilename, setSshPrivateText)}
                  isDisabled={sshKeyMode === "new"}
                  hideDefaultPreview
                />
              </FormGroup>
              <FormGroup label="SSH 공개 키 파일" isRequired fieldId="ssh-public-key">
                <FileUpload
                  id="ssh-public-key-file"
                  type="text"
                  value=""
                  filename={sshPublicFilename}
                  filenamePlaceholder="선택된 파일 없음"
                  onFileInputChange={(_, file) => readTextFile(file, setSshPublicFilename, setSshPublicText)}
                  isDisabled={sshKeyMode === "new"}
                  hideDefaultPreview
                />
              </FormGroup>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="클러스터 구성 파일" id="cluster-config-ip-info">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터를 구성하는 호스트 및 가상머신은 SSH 연결 및 고가용성 구성 등을 위해 호스트 프로파일을 생성하여 사용합니다.
                호스트명 및 IP 정보를 모두 사전 준비한 후 아래의 정보를 구성하십시오.
              </Content>
            </Content>
            <Form className="ct-cluster-config-wizard__section ct-cluster-config-wizard__form-horizontal" isHorizontal>
              <FormGroup label="클러스터 호스트 구분" isRequired fieldId="cluster-host-mode">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="cluster-host-new"
                    name="cluster-host-mode"
                    label="신규 클러스터 호스트"
                    isChecked={clusterHostMode === "new"}
                    onChange={() => {
                      setClusterHostMode("new");
                      setHostsFileMode("new");
                    }}
                  />
                  <Radio
                    id="cluster-host-add"
                    name="cluster-host-mode"
                    label="추가 호스트"
                    isChecked={clusterHostMode === "add"}
                    isDisabled={!canUseAddHost}
                    onChange={() => {
                      setClusterHostMode("add");
                      setHostsFileMode("existing");
                      setSshKeyMode("existing");
                    }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="클러스터 구성 파일 준비" isRequired fieldId="hosts-file-mode">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="hosts-file-new"
                    name="hosts-file-mode"
                    label="신규 생성"
                    isChecked={hostsFileMode === "new"}
                    isDisabled={clusterHostMode === "add"}
                    onChange={() => setHostsFileMode("new")}
                  />
                  <Radio
                    id="hosts-file-existing"
                    name="hosts-file-mode"
                    label="기존 파일 사용"
                    isChecked={hostsFileMode === "existing"}
                    onChange={() => setHostsFileMode("existing")}
                  />
                </div>
              </FormGroup>

              {hostsFileMode === "existing" && (
                <FormGroup label="클러스터 구성 파일" fieldId="hosts-file">
                  <FileUpload
                    id="hosts-file"
                    type="text"
                    value=""
                    filename={hostsFilename}
                    filenamePlaceholder="선택된 파일 없음"
                    onFileInputChange={(_, file) => readTextFile(file, setHostsFilename, setHostsFileText)}
                    hideDefaultPreview
                  />
                </FormGroup>
              )}

              <FormGroup label="현재 호스트명" isRequired fieldId="current-hostname">
                <TextInput
                  id="current-hostname"
                  value={currentHostname}
                  onChange={(_event, value) => setCurrentHostname(value)}
                  readOnly
                />
              </FormGroup>

              {clusterType === "ablestack-vm" && (
                <FormGroup label="iSCSI 스토리지 전용" fieldId="iscsi-storage-exclusive">
                  <Switch
                    id="iscsi-storage-exclusive"
                    label="사용"
                    labelOff="미사용"
                    isChecked={isIscsiExclusive}
                    isDisabled={hostsFileMode === "existing"}
                    onChange={(_event, checked) => setIsIscsiExclusive(checked)}
                  />
                </FormGroup>
              )}

              <FormGroup label="구성할 호스트 수" isRequired fieldId="host-count">
                <div className="ct-cluster-config-wizard__stepper">
                  <Button
                    variant="control"
                    isDisabled={hostsFileMode === "existing" || isStandalone}
                    onClick={() => updateHostCount(hostCount - 1)}
                  >
                    -
                  </Button>
                  <div className="ct-cluster-config-wizard__stepper-value">{hostCount}</div>
                  <Button
                    variant="control"
                    isDisabled={hostsFileMode === "existing" || isStandalone}
                    onClick={() => updateHostCount(hostCount + 1)}
                  >
                    +
                  </Button>
                  <span className="ct-cluster-config-wizard__stepper-unit">대</span>
                </div>
              </FormGroup>

              {renderHostTable()}

              {!isVmAddHost && (
                <>
                  <FormGroup label="CCVM 관리 IP" isRequired fieldId="ccvm-ip">
                    <TextInput id="ccvm-ip" value={ccvmMgmtIp} onChange={(_event, value) => setCcvmMgmtIp(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                  <FormGroup label="관리 NIC CIDR" fieldId="mgmt-cidr">
                    <TextInput id="mgmt-cidr" value={mgmtCidr} onChange={(_event, value) => setMgmtCidr(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                  <FormGroup label="관리 NIC Gateway" fieldId="mgmt-gw">
                    <TextInput id="mgmt-gw" value={mgmtGateway} onChange={(_event, value) => setMgmtGateway(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                  <FormGroup label="관리 NIC DNS" fieldId="mgmt-dns">
                    <TextInput id="mgmt-dns" value={mgmtDns} onChange={(_event, value) => setMgmtDns(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                </>
              )}

              {!isVmLikeCluster && (
                <>
                  <FormGroup label="PCS 호스트 PN IP #1" isRequired fieldId="pcs-pn-1">
                    <TextInput id="pcs-pn-1" value={pcsPnIp1} onChange={(_event, value) => setPcsPnIp1(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                  <FormGroup label="PCS 호스트 PN IP #2" isRequired fieldId="pcs-pn-2">
                    <TextInput id="pcs-pn-2" value={pcsPnIp2} onChange={(_event, value) => setPcsPnIp2(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                  <FormGroup label="PCS 호스트 PN IP #3" isRequired fieldId="pcs-pn-3">
                    <TextInput id="pcs-pn-3" value={pcsPnIp3} onChange={(_event, value) => setPcsPnIp3(value)} isDisabled={hostsFileMode === "existing"} />
                  </FormGroup>
                </>
              )}

              {isVmAddHost && (
                <div className="ct-cluster-config-wizard__field-group">
                  <div className="ct-cluster-config-wizard__field-group-title">추가할 호스트 정보</div>
                  <FormGroup label="IPMI IP" isRequired fieldId="ipmi-ip">
                    <TextInput id="ipmi-ip" value={ipmiIp} placeholder="xxx.xxx.xxx.xxx 형식으로 입력" onChange={(_event, value) => setIpmiIp(value)} />
                  </FormGroup>
                  <FormGroup label="IPMI 아이디" isRequired fieldId="ipmi-user">
                    <TextInput id="ipmi-user" value={ipmiUser} placeholder="아이디를 입력하세요." onChange={(_event, value) => setIpmiUser(value)} />
                  </FormGroup>
                  <FormGroup label="IPMI 비밀번호" isRequired fieldId="ipmi-password">
                    <TextInput id="ipmi-password" type="password" value={ipmiPassword} placeholder="비밀번호를 입력하세요." onChange={(_event, value) => setIpmiPassword(value)} />
                  </FormGroup>
                </div>
              )}
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="시간서버" id="cluster-config-time-server">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                스토리지의 무결성을 유지하고, 가용성을 높이기 위해서 호스트 및 가상머신의 시간동기화는 필수적입니다.
                시간 동기화가 이루어지지 않아 호스트의 시간이 서로 다르면 스토리지가 중단되며, 가상머신이 제대로 운영되지 않게 됩니다.
                인터넷 연결이 되지 않는 환경이라면 반드시 내부 시간 서버를 구성한 후 클러스터를 구성해야 합니다.
              </Content>
            </Content>
            <Form className="ct-cluster-config-wizard__section ct-cluster-config-wizard__form-horizontal" isHorizontal>
              <FormGroup label="시간서버 종류" isRequired fieldId="time-server-type">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="time-server-local"
                    name="time-server-type"
                    label="로컬 시간서버"
                    isChecked={timeServerType === "internal"}
                    onChange={() => setTimeServerType("internal")}
                  />
                  <Radio
                    id="time-server-external"
                    name="time-server-type"
                    label="외부 시간서버"
                    isChecked={timeServerType === "external"}
                    onChange={() => setTimeServerType("external")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="현재 Host" isRequired fieldId="host-role">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="host-role-master"
                    name="host-role"
                    label="Master Server"
                    isChecked={hostRole === "master"}
                    onChange={() => setHostRole("master")}
                  />
                  <Radio
                    id="host-role-second"
                    name="host-role"
                    label="Second Server"
                    isChecked={hostRole === "second"}
                    onChange={() => setHostRole("second")}
                  />
                  <Radio
                    id="host-role-other"
                    name="host-role"
                    label="Other Server"
                    isChecked={hostRole === "other"}
                    onChange={() => setHostRole("other")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="외부 시간서버" fieldId="external-time-server">
                <TextInput
                  id="external-time-server"
                  value={externalTimeServer}
                  onChange={(_event, value) => setExternalTimeServer(value)}
                />
              </FormGroup>
              <FormGroup label="시간서버 #1" isRequired fieldId="time-server-1">
                <TextInput id="time-server-1" value={timeServer1} onChange={(_event, value) => setTimeServer1(value)} />
              </FormGroup>
              <FormGroup label="시간서버 #2" fieldId="time-server-2">
                <TextInput id="time-server-2" value={timeServer2} onChange={(_event, value) => setTimeServer2(value)} />
              </FormGroup>
              <div className="ct-cluster-config-wizard__info">
                <InfoCircleIcon aria-hidden="true" />
                <div>
                  <div className="ct-cluster-config-wizard__info-title">시간서버 구성시 참고사항</div>
                  <div>구성할 호스트의 수가 3대 미만인 경우 로컬 시간서버 기능이 비활성화 됩니다.</div>
                </div>
              </div>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="설정확인" id="cluster-config-review">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터 구성을 위해 설정한 SSH Key, 호스트 프로파일, 시간 동기화 서버 정보는 다음과 같습니다.
                정보를 수정해야 하는 경우 해당 단계로 이동하십시오. 설정을 완료하려면 "완료" 버튼을 눌러 설정을 완료합니다.
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__review-accordion">
              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() =>
                    setReviewOpen((prev) => ({ ...prev, clusterType: !prev.clusterType }))
                  }
                >
                  <span>클러스터 종류</span>
                  <span className={reviewOpen.clusterType ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.clusterType && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 종류</DescriptionListTerm>
                        <DescriptionListDescription>{clusterTypeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, sshKey: !prev.sshKey }))}
                >
                  <span>SSH Key 파일</span>
                  <span className={reviewOpen.sshKey ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.sshKey && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>SSH Key 준비 방법</DescriptionListTerm>
                        <DescriptionListDescription>{sshKeyModeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Private Key 내용</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={sshPrivateText || (sshKeyMode === "new" ? "신규 SSH 개인 키는 구성 실행 시 생성됩니다." : sshPrivateFilename)}
                            rows={6}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Public Key 내용</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={sshPublicText || (sshKeyMode === "new" ? "신규 SSH 공개 키는 구성 실행 시 생성됩니다." : sshPublicFilename)}
                            rows={6}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() =>
                    setReviewOpen((prev) => ({ ...prev, clusterConfig: !prev.clusterConfig }))
                  }
                >
                  <span>클러스터 구성 파일</span>
                  <span className={reviewOpen.clusterConfig ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.clusterConfig && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 구성 준비</DescriptionListTerm>
                        <DescriptionListDescription>{hostsFileModeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 호스트 구분</DescriptionListTerm>
                        <DescriptionListDescription>{clusterHostMode === "new" ? "신규 클러스터 호스트" : "추가 호스트"}</DescriptionListDescription>
                      </DescriptionListGroup>
                      {clusterType === "ablestack-vm" && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>iSCSI 스토리지 전용</DescriptionListTerm>
                          <DescriptionListDescription>{isIscsiExclusive ? "사용" : "미사용"}</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 구성 프로파일</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={buildHostsPreview()}
                            rows={6}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {!isVmAddHost && (
                        <>
                          <DescriptionListGroup>
                            <DescriptionListTerm>CCVM 관리 IP</DescriptionListTerm>
                            <DescriptionListDescription>{ccvmMgmtIp}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>관리 NIC CIDR</DescriptionListTerm>
                            <DescriptionListDescription>{mgmtCidr}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>관리 NIC Gateway</DescriptionListTerm>
                            <DescriptionListDescription>{mgmtGateway}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>관리 NIC DNS</DescriptionListTerm>
                            <DescriptionListDescription>{mgmtDns}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </>
                      )}
                      {!isVmLikeCluster && (
                        <>
                          <DescriptionListGroup>
                            <DescriptionListTerm>PCS 호스트 PN IP #1</DescriptionListTerm>
                            <DescriptionListDescription>{pcsPnIp1}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>PCS 호스트 PN IP #2</DescriptionListTerm>
                            <DescriptionListDescription>{pcsPnIp2}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>PCS 호스트 PN IP #3</DescriptionListTerm>
                            <DescriptionListDescription>{pcsPnIp3}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </>
                      )}
                      {isVmAddHost && (
                        <>
                          <DescriptionListGroup>
                            <DescriptionListTerm>IPMI IP</DescriptionListTerm>
                            <DescriptionListDescription>{ipmiIp}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>IPMI 아이디</DescriptionListTerm>
                            <DescriptionListDescription>{ipmiUser}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>cluster.json 미리보기</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={buildClusterJsonPreview()}
                            rows={8}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() =>
                    setReviewOpen((prev) => ({ ...prev, timeServer: !prev.timeServer }))
                  }
                >
                  <span>시간서버</span>
                  <span className={reviewOpen.timeServer ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.timeServer && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>시간서버 종류</DescriptionListTerm>
                        <DescriptionListDescription>{timeServerTypeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>로컬 시간서버</DescriptionListTerm>
                        <DescriptionListDescription>{hostRoleLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>외부 시간 서버</DescriptionListTerm>
                        <DescriptionListDescription>{externalTimeServer}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>시간서버 #1</DescriptionListTerm>
                        <DescriptionListDescription>{timeServer1}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>시간서버 #2</DescriptionListTerm>
                        <DescriptionListDescription>{timeServer2}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="구성" id="cluster-config-finish">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터 구성 준비 중입니다. 전체 3단계 중 1단계 진행 중입니다.
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__status-list">
              <div>
                <Label color="blue" variant="outline">준비중</Label>
                <span>SSH Key File 생성</span>
              </div>
              <div>
                <Label color="blue" variant="outline">준비중</Label>
                <span>{isVmAddHost ? "Cluster Config 및 Hosts 파일 생성 및 PCS 호스트 추가 설정" : "Cluster Config 및 Hosts 파일 생성"}</span>
              </div>
              <div>
                <Label color="blue" variant="outline">준비중</Label>
                <span>시간서버 설정 생성 및 마무리</span>
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="완료" id="cluster-config-complete">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                ABLESTACK 클러스터 구성을 위한 모든 설정이 완료되었습니다.
              </Content>
              <Content component="p">
                SSH Key 파일 및 호스트 프로파일을 다운로드 받아 스토리지센터 및 클라우드센터 가상머신 배포 시 사용하십시오.
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__download-list">
              <span>
                - Private SSH Key 다운로드
                <a
                  className="pf-v6-c-button pf-m-link"
                  href={downloadHref(sshPrivateText)}
                  download="id_rsa"
                >
                  파일을 재사용 하려면 클릭하십시오
                </a>
              </span>
              <span>
                - Public SSH Key 다운로드
                <a
                  className="pf-v6-c-button pf-m-link"
                  href={downloadHref(sshPublicText)}
                  download="id_rsa.pub"
                >
                  파일을 재사용 하려면 클릭하십시오
                </a>
              </span>
              <span>
                - 클러스터 구성 프로파일 다운로드
                <a
                  className="pf-v6-c-button pf-m-link"
                  href={downloadHref(buildClusterJsonPreview())}
                  download="cluster.json"
                >
                  파일을 재사용 하려면 클릭하십시오
                </a>
              </span>
            </div>
          </div>
        </WizardStep>
      </Wizard>
      </Modal>
      <ValidationErrorModal
        isOpen={Boolean(validationMessage)}
        message={validationMessage}
        onClose={() => setValidationMessage("")}
      />
    </>
  );
}
