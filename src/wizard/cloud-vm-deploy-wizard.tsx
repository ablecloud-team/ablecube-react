import React from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Wizard,
  WizardStep,
  Title,
  Content,
  Form,
  FormGroup,
  Radio,
  Checkbox,
  TextInput,
  TextArea,
  FileUpload,
  FormSelect,
  FormSelectOption,
  Button,
  Label,
  Spinner,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
} from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";

import ValidationErrorModal from "../components/common/ValidationErrorModal";
import "./cloud-vm-deploy-wizard.scss";
import {
  duplicateMessage,
  getIpFromCidr,
  isIntegerInRange,
  isIpv4,
  isHostname,
  optionalIpv4,
  optionalVlan,
  requireHostname,
  requireIpv4Cidr,
} from "./validation";

type HostsFileMode = "existing" | "new";
type ClusterType = "ablestack-hci" | "ablestack-vm" | "ablestack-standalone" | "ablestack-hci-filesystem";

interface SelectOption {
  value: string;
  label: string;
}

interface ClusterHostRow {
  hostName: string;
  hostIp: string;
  ccvmMgmtIp: string;
  hostPnIp: string;
  hostCnIp: string;
}

interface CloudVmDeployWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterType?: ClusterType;
}

const DEFAULT_HOSTS: ClusterHostRow[] = [
  {
    hostName: "",
    hostIp: "",
    ccvmMgmtIp: "",
    hostPnIp: "",
    hostCnIp: "",
  }
];

const ROOT_DISK = "500 GiB (THIN Provisioning)";

const BRIDGE_OPTIONS: SelectOption[] = [
  { value: "bridge0", label: "bridge0 (connected)" },
];

const defaultFailoverHosts = () => DEFAULT_HOSTS.map((host) => host.hostPnIp);

export default function CloudVmDeployWizardModal({
  isOpen,
  onClose,
  clusterType = "ablestack-hci",
}: CloudVmDeployWizardModalProps) {
  const [clusterSensitivity, setClusterSensitivity] = React.useState("5");
  const [cpu, setCpu] = React.useState("");
  const [memory, setMemory] = React.useState("");
  const [mgmtBridge, setMgmtBridge] = React.useState("");
  const [svcEnabled, setSvcEnabled] = React.useState(false);
  const [svcBridge, setSvcBridge] = React.useState("");

  const [hostsFileMode, setHostsFileMode] = React.useState<HostsFileMode>("existing");
  const [currentHostname] = React.useState("");
  const [hostCount, setHostCount] = React.useState(3);
  const [hosts, setHosts] = React.useState<ClusterHostRow[]>(DEFAULT_HOSTS);

  const [ccvmHostname, setCcvmHostname] = React.useState("ccvm");
  const [mgmtIp, setMgmtIp] = React.useState(""); // 10.10.1.10/16
  const [mgmtGateway, setMgmtGateway] = React.useState("");
  const [mgmtDns, setMgmtDns] = React.useState("");
  const [mgmtVlan, setMgmtVlan] = React.useState("");
  const [svcIp, setSvcIp] = React.useState("");
  const [svcGateway, setSvcGateway] = React.useState("");
  const [svcDns, setSvcDns] = React.useState("");
  const [svcVlan, setSvcVlan] = React.useState("");

  const [sshPrivateKey, setSshPrivateKey] = React.useState("");
  const [sshPublicKey, setSshPublicKey] = React.useState("");
  const [sshPrivateFilename, setSshPrivateFilename] = React.useState("");
  const [sshPublicFilename, setSshPublicFilename] = React.useState("");

  const [failoverMembers, setFailoverMembers] = React.useState(3);
  const [failoverHosts, setFailoverHosts] = React.useState<string[]>(defaultFailoverHosts);

  const [reviewOpen, setReviewOpen] = React.useState({
    appliance: true,
    additional: true,
    ssh: true,
    cluster: true,
  });
  const [disableNav, setDisableNav] = React.useState(false);
  const [showDeployConfirm, setShowDeployConfirm] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [isDeployStarted, setIsDeployStarted] = React.useState(false);
  const [validationMessage, setValidationMessage] = React.useState("");
  const deployNextStepRef = React.useRef<(() => void) | null>(null);
  const isVmClusterType = clusterType === "ablestack-vm";

  const resetState = React.useCallback(() => {
    setClusterSensitivity("5");
    setCpu("");
    setMemory("");
    setMgmtBridge("");
    setSvcEnabled(false);
    setSvcBridge("");
    setHostsFileMode("existing");
    setHostCount(3);
    setHosts(DEFAULT_HOSTS);
    setCcvmHostname("ccvm");
    setMgmtIp(""); // 10.10.1.10/16
    setMgmtGateway("");
    setMgmtDns("");
    setMgmtVlan("");
    setSvcIp("");
    setSvcGateway("");
    setSvcDns("");
    setSvcVlan("");
    setSshPrivateKey("");
    setSshPublicKey("");
    setSshPrivateFilename("");
    setSshPublicFilename("");
    setFailoverMembers(3);
    setFailoverHosts(defaultFailoverHosts());
    setReviewOpen({ appliance: true, additional: true, ssh: true, cluster: true });
    setDisableNav(false);
    setShowDeployConfirm(false);
    setShowCancelConfirm(false);
    setIsDeployStarted(false);
    setValidationMessage("");
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const requestClose = () => {
    setShowCancelConfirm(true);
  };

  const resizeFailoverHosts = (nextCount: number) => {
    setFailoverMembers(nextCount);
    setFailoverHosts((prev) =>
      Array.from(
        { length: nextCount },
        (_, index) => prev[index] ?? DEFAULT_HOSTS[index]?.hostPnIp ?? ""
      )
    );
  };

  const updateHostCount = (nextCount: number) => {
    const safeCount = Math.max(3, Math.min(99, nextCount));
    setHostCount(safeCount);
    setHosts((prev) => {
      if (safeCount === prev.length) return prev;
      if (safeCount < prev.length) return prev.slice(0, safeCount);
      const extras = Array.from({ length: safeCount - prev.length }, (_, idx) => ({
        hostName: `ablecube${prev.length + idx + 21}`,
        hostIp: "",
        ccvmMgmtIp: mgmtIp.split("/")[0],
        hostPnIp: "",
        hostCnIp: "",
      }));
      return [...prev, ...extras];
    });
    resizeFailoverHosts(safeCount);
  };

  const updateHost = (index: number, key: keyof ClusterHostRow, value: string) => {
    setHosts((prev) => prev.map((host, hostIndex) => (
      hostIndex === index ? { ...host, [key]: value } : host
    )));
  };

  const updateFailoverHost = (index: number, value: string) => {
    setFailoverHosts((prev) => prev.map((host, hostIndex) => (
      hostIndex === index ? value : host
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

  const getOptionLabel = (options: SelectOption[], value: string) =>
    options.find((option) => option.value === value)?.label || value || "미입력";

  const buildHostsPreview = () => {
    const lines: string[] = [];
    lines.push(`${mgmtIp.split("/")[0]} ccvm-mngt ccvm`);
    hosts.slice(0, hostCount).forEach((row, index) => {
      const hostAlias = row.hostName === currentHostname ? "\tablecube" : "";
      const hostIndex = index + 1;
      lines.push(`${row.hostIp}\t${row.hostName}${hostAlias}`);
      lines.push(`${row.hostPnIp}\tpn-ablecube${hostIndex}${row.hostName === currentHostname ? "\tpn-ablecube" : ""}`);
      lines.push(`${row.hostCnIp}\tcn-ablecube${hostIndex}${row.hostName === currentHostname ? "\tcn-ablecube" : ""}`);
    });
    return lines.join("\n");
  };

  const networkConfigLabel = svcEnabled ? "관리네트워크, 서비스네트워크" : "관리네트워크";

  const validateCloudVmDeploy = () => {
    const sensitivity = Number(clusterSensitivity);
    const profileRows = hosts.slice(0, hostCount);
    const failoverRows = failoverHosts.slice(0, failoverMembers);

    if (isVmClusterType && (!Number.isFinite(sensitivity) || !isIntegerInRange(clusterSensitivity, 5, 300))) {
      return "클러스터 민감도는 5~300초 범위로 입력해야 합니다.";
    }
    if (!cpu) return "CPU Core를 선택해주세요.";
    if (!memory) return "Memory를 선택해주세요.";
    if (!mgmtBridge) return "관리네트워크 Bridge를 선택해주세요.";
    if (svcEnabled && !svcBridge) return "서비스네트워크 Bridge를 선택해주세요.";

    for (let index = 0; index < profileRows.length; index += 1) {
      const row = profileRows[index];
      const hostLabel = `${index + 1}번 호스트`;
      if (!row.hostName || !row.hostIp || !row.ccvmMgmtIp || !row.hostPnIp || !row.hostCnIp) {
        return "클러스터 구성 프로파일의 호스트명/IP 정보를 확인해주세요.";
      }
      if (!isHostname(row.hostName)) return `${hostLabel} 호스트명 입력 형식을 확인해주세요.`;
      if (!isIpv4(row.hostIp)) return `${hostLabel} 호스트 IP 형식을 확인해주세요.`;
      if (!isIpv4(row.ccvmMgmtIp)) return `${hostLabel} CCVM 관리 IP 형식을 확인해주세요.`;
      if (!isIpv4(row.hostPnIp)) return `${hostLabel} HOST PN IP 형식을 확인해주세요.`;
      if (!isIpv4(row.hostCnIp)) return `${hostLabel} HOST CN IP 형식을 확인해주세요.`;
    }

    const hostNameMessage = requireHostname(ccvmHostname, "클라우드센터 가상머신의 호스트명");
    if (hostNameMessage) return hostNameMessage;
    const mgmtIpMessage = requireIpv4Cidr(mgmtIp, "관리 NIC IP");
    if (mgmtIpMessage) return mgmtIpMessage;
    const mgmtGatewayMessage = optionalIpv4(mgmtGateway, "관리 NIC Gateway");
    if (mgmtGatewayMessage) return mgmtGatewayMessage;
    const mgmtDnsMessage = optionalIpv4(mgmtDns, "관리 NIC DNS");
    if (mgmtDnsMessage) return mgmtDnsMessage;
    const mgmtVlanMessage = optionalVlan(mgmtVlan, "관리 VLAN ID");
    if (mgmtVlanMessage) return mgmtVlanMessage;

    if (svcEnabled) {
      const svcIpMessage = requireIpv4Cidr(svcIp, "서비스 NIC IP");
      if (svcIpMessage) return svcIpMessage;
      if (!isIpv4(svcGateway)) return "서비스 NIC Gateway 형식을 확인해주세요.";
      const svcDnsMessage = optionalIpv4(svcDns, "서비스 NIC DNS");
      if (svcDnsMessage) return svcDnsMessage;
      const svcVlanMessage = optionalVlan(svcVlan, "서비스 VLAN ID");
      if (svcVlanMessage) return svcVlanMessage;
    }

    if (!isIntegerInRange(failoverMembers, 1, 99)) return "클러스터 멤버수는 1~99 범위로 입력해주세요.";
    for (let index = 0; index < failoverRows.length; index += 1) {
      const host = failoverRows[index] ?? "";
      if (!host.trim()) return "장애조치 클러스터의 PCS 호스트 PN IP를 입력해주세요.";
      if (!isIpv4(host)) return `PCS 호스트 #${index + 1} PN IP 형식을 확인해주세요.`;
    }

    const duplicateProfileIpMessage = duplicateMessage(
      [
        ...profileRows.flatMap((row) => [row.hostIp, row.hostPnIp, row.hostCnIp]),
        getIpFromCidr(mgmtIp),
        svcEnabled ? getIpFromCidr(svcIp) : "",
      ],
      "중복된 IP가 존재합니다."
    );
    if (duplicateProfileIpMessage) return duplicateProfileIpMessage;
    const duplicateFailoverMessage = duplicateMessage(failoverRows, "중복된 PCS 호스트 PN IP가 존재합니다.");
    if (duplicateFailoverMessage) return duplicateFailoverMessage;
    return "";
  };

  const executeMockDeploy = () => {
    const errorMessage = validateCloudVmDeploy();
    if (errorMessage) {
      setValidationMessage(errorMessage);
      setShowDeployConfirm(false);
      return;
    }

    setValidationMessage("");
    setShowDeployConfirm(false);
    setIsDeployStarted(true);
    setDisableNav(true);
    deployNextStepRef.current?.();
  };

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "cloud-vm-overview";
    const isReview = stepId === "cloud-vm-review";
    const isDeploy = stepId === "cloud-vm-deploy";
    const isFinish = stepId === "cloud-vm-finish";

    if (isDeploy) {
      return (
        <div className="ct-cloud-vm-wizard__footer">
          <Button variant="primary" onClick={goToNextStep}>
            다음
          </Button>
        </div>
      );
    }

    return (
      <div className="ct-cloud-vm-wizard__footer">
        {!isFinish && (
          <Button
            variant="primary"
            onClick={() => {
              if (isReview) {
                deployNextStepRef.current = goToNextStep;
                setShowDeployConfirm(true);
                return;
              }
              goToNextStep();
            }}
          >
            {isReview ? "배포" : "다음"}
          </Button>
        )}
        {!isFirst && !isFinish && (
          <Button variant="secondary" onClick={goToPrevStep}>
            이전
          </Button>
        )}
        {!isFinish && (
          <Button variant="link" onClick={() => setShowCancelConfirm(true)}>
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        variant="large"
        aria-label="클라우드센터 가상머신 배포 마법사"
        className="ct-cloud-vm-wizard__modal"
      >
        <Wizard
          onClose={requestClose}
          onSave={handleClose}
          width="100%"
          navAriaLabel="클라우드센터 가상머신 배포 단계"
          className={disableNav ? "ct-cloud-vm-wizard ct-cloud-vm-wizard--nav-locked" : "ct-cloud-vm-wizard"}
          footer={wizardFooter}
          onStepChange={(_event, currentStep) => {
            const stepId = String(currentStep.id);
            setDisableNav(stepId === "cloud-vm-deploy" || stepId === "cloud-vm-finish");
          }}
          header={
            <div className="ct-cloud-vm-wizard__header">
              <div>
                <Title headingLevel="h1" size="2xl" className="ct-cloud-vm-wizard__title">
                  ABLESTACK 클라우드센터 VM 배포 마법사
                </Title>
                <Content className="ct-cloud-vm-wizard__subtitle">
                  <Content component="p">
                    ABLESTACK 클러스터에 클라우드센터를 실행하는 가상머신 어플라이언스를 배포합니다.
                  </Content>
                </Content>
              </div>
              <button
                type="button"
                className="ct-cloud-vm-wizard__close"
                aria-label="Close"
                onClick={requestClose}
              >
                ×
              </button>
            </div>
          }
        >
          <WizardStep name="개요" id="cloud-vm-overview">
            <div className="ct-cloud-vm-wizard__content">
              <Content>
                <Content component="p">
                  클라우드센터 VM을 배포하기 위해 필요한 정보를 다음과 같이 마법사를 통해 입력받습니다.
                </Content>
                <Content component="ul">
                  <Content component="li">클라우드센터 VM의 HA구성을 위한 클러스터 설정 정보</Content>
                  <Content component="li">클라우드센터 VM의 CPU, Memory, Disk, Network에 대한 정보</Content>
                  <Content component="li">가상머신의 호스트명 등의 네트워크 정보</Content>
                  <Content component="li">호스트 및 가상머신 간의 상호 SSH 연결을 위한 SSH Key 정보</Content>
                </Content>
                <Content component="p">
                  필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 클라우드센터 VM 배포를 시작합니다.
                </Content>
              </Content>
            </div>
          </WizardStep>

          <WizardStep
            name="클라우드센터 VM 설정"
            id="cloud-vm-appliance"
            steps={[
              ...(isVmClusterType ? [
                <WizardStep name="클러스터 민감도" id="cloud-vm-cluster-sync-mechanism" key="cloud-vm-cluster-sync-mechanism">
                  <div className="ct-cloud-vm-wizard__content">
                    <Content>
                      <Content component="p">
                        <strong>클라우드센터 VM</strong>에서 클러스터 노드 간 동기화는 중요한 역할을 합니다.
                        이를 통해 통신의 순서와 타이밍을 제어하고, 리더 노드를 결정하며, 장애 복구를 지원합니다.
                      </Content>
                      <Content component="ul">
                        <Content component="li">통신 순서 제어: 다수 노드가 동시에 데이터를 전송할 때 데이터 충돌을 방지합니다.</Content>
                        <Content component="li">타이밍 동기화: 각 노드는 Token을 통해 동기화된 시간 기준으로 작업을 수행합니다.</Content>
                        <Content component="li">장애 복구: Token 전달 상태를 기반으로 장애를 감지하고 복구를 시도합니다.</Content>
                      </Content>
                    </Content>
                    <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                      <FormGroup label="클러스터 민감도(초)" isRequired fieldId="cloud-vm-sensitivity">
                        <TextInput
                          id="cloud-vm-sensitivity"
                          type="number"
                          min="5"
                          max="300"
                          value={clusterSensitivity}
                          onChange={(_event, value) => setClusterSensitivity(String(value))}
                        />
                      </FormGroup>
                    </Form>
                    <Alert
                      isInline
                      title="클러스터 민감도 설정 시 참고사항"
                      variant="info"
                      icon={<InfoCircleIcon />}
                      className="ct-cloud-vm-wizard__info"
                    >
                      <Content component="p">
                        안정적인 클러스터 동작을 위해서는 최소 5초에서 최대 5분(300초)의 시간 범위 내에서 네트워크 품질을 유지하는 것이 권장됩니다.
                      </Content>
                      <Content component="p">
                        클러스터 환경의 규모나 복잡성에 따라 Token 전파 시간과 장애 복구 시간이 달라질 수 있습니다.
                      </Content>
                    </Alert>
                  </div>
                </WizardStep>,
              ] : []),
              <WizardStep name="컴퓨트" id="cloud-vm-compute" key="cloud-vm-compute">
                <div className="ct-cloud-vm-wizard__content">
                  <Content>
                    <Content component="p">
                      클라우드센터 VM의 CPU 및 Memory, ROOT Disk 등의 정보를 설정합니다.
                      아래의 항목에 적합한 값을 선택하여 입력하십시오.
                    </Content>
                  </Content>
                  <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                    <FormGroup label="CPU Core" isRequired fieldId="cloud-vm-cpu">
                      <FormSelect id="cloud-vm-cpu" value={cpu} onChange={(_event, value) => setCpu(String(value))}>
                        <FormSelectOption value="8" label="8 vCore" />
                        <FormSelectOption value="16" label="16 vCore" />
                      </FormSelect>
                    </FormGroup>
                    <FormGroup label="Memory" isRequired fieldId="cloud-vm-memory">
                      <FormSelect
                        id="cloud-vm-memory"
                        value={memory}
                        onChange={(_event, value) => setMemory(String(value))}
                      >
                        <FormSelectOption value="16" label="16 GiB" />
                        <FormSelectOption value="32" label="32 GiB" />
                        <FormSelectOption value="64" label="64 GiB" />
                      </FormSelect>
                    </FormGroup>
                    <FormGroup label="ROOT Disk" fieldId="cloud-vm-root-disk">
                      <TextInput id="cloud-vm-root-disk" value={ROOT_DISK} readOnly />
                    </FormGroup>
                  </Form>
                  <Alert
                    isInline
                    title="컴퓨트 자원 구성 시 참고사항"
                    variant="info"
                    icon={<InfoCircleIcon />}
                    className="ct-cloud-vm-wizard__info"
                  >
                    <Content component="p">
                      클라우드센터 VM의 Compute 자원은 클라우드센터가 관리해야 할 호스트의 수에 따라 탄력적으로 선택합니다.
                    </Content>
                    <Content component="p">
                      가상머신이 컨트롤 할 호스트의 수가 10개 미만이면 8 vCore를, 그 이상이면 16 vCore를 선택하십시오.
                      메모리는 컨트롤할 호스트의 수가 10개 미만이면 16GiB를, 10 ~ 20개 이면 32GiB를, 21개 이상이면 64GiB를 선택해야 합니다.
                    </Content>
                    <Content component="p">
                      ROOT Disk는 Thin Provisioning 방식으로 제공됩니다.
                    </Content>
                  </Alert>
                </div>
              </WizardStep>,
              <WizardStep name="네트워크" id="cloud-vm-network" key="cloud-vm-network">
                <div className="ct-cloud-vm-wizard__content">
                  <Content>
                    <Content component="p">
                      클라우드센터 VM이 사용할 관리 네트워크용 NIC 정보를 설정합니다.
                      아래의 항목에 적합한 값을 선택하여 입력하십시오.
                    </Content>
                  </Content>
                  <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                    <FormGroup label="네트워크 구성" isRequired fieldId="cloud-vm-network-config">
                      <div className="ct-cloud-vm-wizard__stacked-checks">
                        <Checkbox
                          id="cloud-vm-mgmt-enabled"
                          label="관리네트워크"
                          isChecked
                          isDisabled
                        />
                        <Checkbox
                          id="cloud-vm-svc-enabled"
                          label="서비스네트워크"
                          isChecked={svcEnabled}
                          onChange={(_event, checked) => setSvcEnabled(checked)}
                        />
                      </div>
                    </FormGroup>
                    <FormGroup label="관리네트워크" isRequired fieldId="cloud-vm-mgmt-bridge">
                      <FormSelect
                        id="cloud-vm-mgmt-bridge"
                        value={mgmtBridge}
                        onChange={(_event, value) => setMgmtBridge(String(value))}
                      >
                        {BRIDGE_OPTIONS.map((option) => (
                          <FormSelectOption key={option.value} value={option.value} label={option.label} />
                        ))}
                      </FormSelect>
                    </FormGroup>
                    <FormGroup label="서비스네트워크" isRequired fieldId="cloud-vm-svc-bridge">
                      <FormSelect
                        id="cloud-vm-svc-bridge"
                        value={svcBridge}
                        onChange={(_event, value) => setSvcBridge(String(value))}
                        isDisabled={!svcEnabled}
                      >
                        {BRIDGE_OPTIONS.filter((option) => option.value !== "bridge0").map((option) => (
                          <FormSelectOption key={option.value} value={option.value} label={option.label} />
                        ))}
                      </FormSelect>
                    </FormGroup>
                  </Form>
                  <Alert
                    isInline
                    title="네트워크 구성 시 참고사항"
                    variant="info"
                    icon={<InfoCircleIcon />}
                    className="ct-cloud-vm-wizard__info"
                  >
                    <Content component="p">
                      클라우드센터에 접근하고자 하는 네트워크 위치에 따라 가상머신에 할당할 네트워크와 네트워크의 상위 브릿지를 선택합니다.
                      관리네트워크는 호스트를 관리하기 위해 필수적인 네트워크이며 기본 선택되어 있고, 선택 여부를 변경할 수 없습니다.
                    </Content>
                    <Content component="p">
                      가상머신에 네트워크를 할당하기 전에 반드시 상위 브릿지를 먼저 생성해야 합니다.
                    </Content>
                  </Alert>
                </div>
              </WizardStep>,
            ]}
          />

          <WizardStep name="추가 네트워크 정보" id="cloud-vm-additional">
            <div className="ct-cloud-vm-wizard__content">
              <Content>
                <Content component="p">
                  클라우드센터 VM에 호스트명 등의 부가적인 네트워크 정보를 설정합니다. 아래의 항목에 값을 입력하십시오.
                </Content>
              </Content>
              <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                <FormGroup label="클러스터 구성 파일 준비" isRequired fieldId="cloud-vm-hosts-file">
                  <div className="ct-cloud-vm-wizard__inline">
                    <Radio
                      id="cloud-vm-hosts-file-existing"
                      name="cloud-vm-hosts-file"
                      label="해당 호스트 파일 사용"
                      isChecked={hostsFileMode === "existing"}
                      onChange={() => setHostsFileMode("existing")}
                    />
                    <Radio
                      id="cloud-vm-hosts-file-new"
                      name="cloud-vm-hosts-file"
                      label="신규 생성"
                      isChecked={hostsFileMode === "new"}
                      onChange={() => setHostsFileMode("new")}
                    />
                  </div>
                </FormGroup>
                <FormGroup label="현재 호스트명" isRequired fieldId="cloud-vm-current-host">
                  <TextInput id="cloud-vm-current-host" value={currentHostname} readOnly />
                </FormGroup>
                <FormGroup label="구성할 호스트 수" isRequired fieldId="cloud-vm-host-count">
                  <div className="ct-cloud-vm-wizard__stepper">
                    <Button
                      variant="control"
                      isDisabled={hostsFileMode === "existing"}
                      onClick={() => updateHostCount(hostCount - 1)}
                      aria-label="Minus"
                    >
                      -
                    </Button>
                    <div className="ct-cloud-vm-wizard__stepper-value">{hostCount}</div>
                    <Button
                      variant="control"
                      isDisabled={hostsFileMode === "existing"}
                      onClick={() => updateHostCount(hostCount + 1)}
                      aria-label="Plus"
                    >
                      +
                    </Button>
                    <span className="ct-cloud-vm-wizard__stepper-unit">대</span>
                  </div>
                </FormGroup>
              </Form>

              <div className="ct-cloud-vm-wizard__table-wrap">
                <div className="ct-cloud-vm-wizard__table-title">클러스터 구성 프로파일</div>
                <table className="ct-cloud-vm-wizard__table">
                  <thead>
                    <tr>
                      <th>순번</th>
                      <th>호스트명</th>
                      <th>호스트 IP</th>
                      <th>CCVM<br />MNGT IP</th>
                      <th>HOST PN IP</th>
                      <th>HOST CN IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosts.slice(0, hostCount).map((row, idx) => (
                      <tr key={`cloud-vm-host-row-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>
                          <TextInput
                            aria-label={`호스트명 ${idx + 1}`}
                            value={row.hostName}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostName", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`호스트 IP ${idx + 1}`}
                            value={row.hostIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`CCVM MNGT IP ${idx + 1}`}
                            value={row.ccvmMgmtIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "ccvmMgmtIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`HOST PN IP ${idx + 1}`}
                            value={row.hostPnIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostPnIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`HOST CN IP ${idx + 1}`}
                            value={row.hostCnIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostCnIp", value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                <FormGroup label="호스트명(CCVM)" isRequired fieldId="cloud-vm-hostname">
                  <TextInput
                    id="cloud-vm-hostname"
                    value={ccvmHostname}
                    onChange={(_event, value) => setCcvmHostname(value)}
                  />
                </FormGroup>
                <FormGroup label="관리 NIC IP" isRequired fieldId="cloud-vm-mgmt-ip">
                  <TextInput
                    id="cloud-vm-mgmt-ip"
                    value={mgmtIp}
                    placeholder="xxx.xxx.xxx.xxx/xx 형식으로 입력"
                    onChange={(_event, value) => setMgmtIp(value)}
                  />
                </FormGroup>
                <FormGroup label="관리 NIC Gateway" fieldId="cloud-vm-mgmt-gw">
                  <TextInput
                    id="cloud-vm-mgmt-gw"
                    value={mgmtGateway}
                    placeholder="xxx.xxx.xxx.xxx 형식으로 입력"
                    onChange={(_event, value) => setMgmtGateway(value)}
                  />
                </FormGroup>
                <FormGroup label="관리 NIC DNS" fieldId="cloud-vm-mgmt-dns">
                  <TextInput
                    id="cloud-vm-mgmt-dns"
                    value={mgmtDns}
                    placeholder="xxx.xxx.xxx.xxx 형식으로 입력"
                    onChange={(_event, value) => setMgmtDns(value)}
                  />
                </FormGroup>
                <FormGroup label="관리 VLAN ID" fieldId="cloud-vm-mgmt-vlan">
                  <TextInput
                    id="cloud-vm-mgmt-vlan"
                    value={mgmtVlan}
                    onChange={(_event, value) => setMgmtVlan(value)}
                  />
                </FormGroup>
                <FormGroup label="서비스 NIC IP" fieldId="cloud-vm-svc-ip">
                  <TextInput
                    id="cloud-vm-svc-ip"
                    value={svcIp}
                    placeholder="xxx.xxx.xxx.xxx/xx 형식으로 입력"
                    onChange={(_event, value) => setSvcIp(value)}
                    isDisabled={!svcEnabled}
                  />
                </FormGroup>
                <FormGroup label="서비스 NIC Gateway" fieldId="cloud-vm-svc-gw">
                  <TextInput
                    id="cloud-vm-svc-gw"
                    value={svcGateway}
                    placeholder="xxx.xxx.xxx.xxx 형식으로 입력"
                    onChange={(_event, value) => setSvcGateway(value)}
                    isDisabled={!svcEnabled}
                  />
                </FormGroup>
                <FormGroup label="서비스 NIC DNS" fieldId="cloud-vm-svc-dns">
                  <TextInput
                    id="cloud-vm-svc-dns"
                    value={svcDns}
                    placeholder="xxx.xxx.xxx.xxx 형식으로 입력"
                    onChange={(_event, value) => setSvcDns(value)}
                    isDisabled={!svcEnabled}
                  />
                </FormGroup>
                <FormGroup label="서비스 VLAN ID" fieldId="cloud-vm-svc-vlan">
                  <TextInput
                    id="cloud-vm-svc-vlan"
                    value={svcVlan}
                    onChange={(_event, value) => setSvcVlan(value)}
                    isDisabled={!svcEnabled}
                  />
                </FormGroup>
              </Form>
            </div>
          </WizardStep>

          <WizardStep name="SSH Key 정보" id="cloud-vm-ssh">
            <div className="ct-cloud-vm-wizard__content">
              <Content>
                <Content component="p">
                  클라우드센터 VM과 호스트, 그리고 ABLESTACK을 구성하고 있는 가상머신들과의 SSH 연결을 위해 SSH Key를 설정합니다.
                  기본적으로 현재 호스트의 SSH Key 파일을 자동으로 등록하며, 필요시 다운로드 한 SSH Key 파일로 등록 가능합니다.
                </Content>
              </Content>
              <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                <FormGroup label="SSH 개인 Key 파일" isRequired fieldId="cloud-vm-ssh-private">
                  <FileUpload
                    id="cloud-vm-ssh-private-file"
                    type="text"
                    value=""
                    filename={sshPrivateFilename}
                    filenamePlaceholder="현재 호스트 id_rsa 자동 사용 또는 파일 선택"
                    onFileInputChange={(_, file) => readTextFile(file, setSshPrivateFilename, setSshPrivateKey)}
                    hideDefaultPreview
                  />
                  <TextArea
                    aria-label="SSH 개인 Key 미리보기"
                    className="ct-cloud-vm-wizard__file-preview"
                    value={sshPrivateKey || "현재 호스트 SSH 개인 Key 파일을 자동으로 사용합니다."}
                    rows={4}
                    readOnly
                  />
                </FormGroup>
                <FormGroup label="SSH 공개 Key 파일" isRequired fieldId="cloud-vm-ssh-public">
                  <FileUpload
                    id="cloud-vm-ssh-public-file"
                    type="text"
                    value=""
                    filename={sshPublicFilename}
                    filenamePlaceholder="현재 호스트 id_rsa.pub 자동 사용 또는 파일 선택"
                    onFileInputChange={(_, file) => readTextFile(file, setSshPublicFilename, setSshPublicKey)}
                    hideDefaultPreview
                  />
                  <TextArea
                    aria-label="SSH 공개 Key 미리보기"
                    className="ct-cloud-vm-wizard__file-preview"
                    value={sshPublicKey || "현재 호스트 SSH 공개 Key 파일을 자동으로 사용합니다."}
                    rows={3}
                    readOnly
                  />
                </FormGroup>
              </Form>
              <Alert
                isInline
                title="SSH Key 등록 참고사항"
                variant="info"
                icon={<InfoCircleIcon />}
                className="ct-cloud-vm-wizard__info"
              >
                <Content component="p">
                  SSH Key는 호스트 및 클라우드센터, 스토리지센터 가상머신 등의 ABLESTACK 구성요소 간의 암호화된 인증을 위해 사용됩니다.
                </Content>
                <Content component="p">
                  호스트 간, 가상머신 간의 모든 명령은 SSH를 이용해 전달되며 이 때 SSH Key를 이용해 인증을 처리합니다.
                  따라서 모든 호스트, 가상머신은 동일한 SSH Key를 사용해야 합니다.
                </Content>
              </Alert>
            </div>
          </WizardStep>

          <WizardStep name="장애조치 클러스터 설정" id="cloud-vm-failover">
            <div className="ct-cloud-vm-wizard__content">
              <Content>
                <Content component="p">
                  장애조치 클러스터는 클라우드센터 VM이 실행 중인 호스트에 장애가 발생하는 경우 클라우드센터 VM을 안전하게 다른 호스트에서 실행하도록 하기 위해 구성합니다.
                  장애조치 클러스터를 구성하기 위해 필요한 정보를 아래에 입력하십시오.
                </Content>
              </Content>
              <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                <FormGroup label="클러스터 멤버수" isRequired fieldId="cloud-vm-failover-members">
                  <TextInput
                    id="cloud-vm-failover-members"
                    value={String(failoverMembers)}
                    onChange={(_event, value) => resizeFailoverHosts(Math.max(1, Math.min(99, Number(value) || 1)))}
                    type="number"
                  />
                </FormGroup>
              </Form>

              <div className="ct-cloud-vm-wizard__failover-list">
                {failoverHosts.slice(0, failoverMembers).map((host, index) => (
                  <div className="ct-cloud-vm-wizard__field-group" key={`cloud-vm-failover-host-${index}`}>
                    <div className="ct-cloud-vm-wizard__field-group-title">PCS 호스트 #{index + 1} 정보</div>
                    <Form className="ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                      <FormGroup label="PN IP" isRequired fieldId={`cloud-vm-failover-host-${index}`}>
                        <TextInput
                          id={`cloud-vm-failover-host-${index}`}
                          value={host}
                          placeholder="xxx.xxx.xxx.xxx 형식으로 입력"
                          onChange={(_event, value) => updateFailoverHost(index, value)}
                        />
                      </FormGroup>
                    </Form>
                  </div>
                ))}
              </div>
            </div>
          </WizardStep>

          <WizardStep name="설정확인" id="cloud-vm-review">
            <div className="ct-cloud-vm-wizard__content">
              <Content>
                <Content component="p">
                  클라우드센터 VM의 배포를 위해 입력한 설정 정보는 다음과 같습니다.
                  입력한 정보를 수정하고자 하는 경우, 해당 탭으로 이동하여 정보를 수정하십시오.
                </Content>
                <Content component="p">모든 정보를 확인한 후 "배포"를 시작합니다.</Content>
              </Content>

              <div className="ct-cloud-vm-wizard__review-accordion">
                <div className="ct-cloud-vm-wizard__review-section">
                  <button
                    type="button"
                    className="ct-cloud-vm-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, appliance: !prev.appliance }))}
                  >
                    <span>클라우드센터 VM 설정</span>
                    <span className={reviewOpen.appliance ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                      ▾
                    </span>
                  </button>
                  {reviewOpen.appliance && (
                    <div className="ct-cloud-vm-wizard__review-body">
                      <DescriptionList isCompact className="ct-cloud-vm-wizard__review-detail">
                        {isVmClusterType && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>클러스터 민감도</DescriptionListTerm>
                            <DescriptionListDescription>{clusterSensitivity} 초</DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        <DescriptionListGroup>
                          <DescriptionListTerm>CPU Core</DescriptionListTerm>
                          <DescriptionListDescription>{cpu} vCore</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Memory</DescriptionListTerm>
                          <DescriptionListDescription>{memory} GiB</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>ROOT Disk Size</DescriptionListTerm>
                          <DescriptionListDescription>{ROOT_DISK}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>네트워크 구성</DescriptionListTerm>
                          <DescriptionListDescription>{networkConfigLabel}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>관리용 Bridge</DescriptionListTerm>
                          <DescriptionListDescription>
                            관리 네트워크 : {getOptionLabel(BRIDGE_OPTIONS, mgmtBridge)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>서비스용 Bridge</DescriptionListTerm>
                          <DescriptionListDescription>
                            {svcEnabled ? getOptionLabel(BRIDGE_OPTIONS, svcBridge) : "N/A"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>

                <div className="ct-cloud-vm-wizard__review-section">
                  <button
                    type="button"
                    className="ct-cloud-vm-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, additional: !prev.additional }))}
                  >
                    <span>추가 네트워크 정보</span>
                    <span className={reviewOpen.additional ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                      ▾
                    </span>
                  </button>
                  {reviewOpen.additional && (
                    <div className="ct-cloud-vm-wizard__review-body">
                      <DescriptionList isCompact className="ct-cloud-vm-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>클러스터 구성 준비</DescriptionListTerm>
                          <DescriptionListDescription>
                            {hostsFileMode === "existing" ? "해당 호스트 파일 사용" : "신규 생성"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>클러스터 구성 프로파일</DescriptionListTerm>
                          <DescriptionListDescription>
                            <TextArea
                              aria-label="클러스터 구성 프로파일 미리보기"
                              readOnly
                              value={buildHostsPreview()}
                              rows={6}
                              className="ct-cloud-vm-wizard__review-textarea"
                            />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>호스트명(CCVM)</DescriptionListTerm>
                          <DescriptionListDescription>{ccvmHostname}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>관리 NIC 정보</DescriptionListTerm>
                          <DescriptionListDescription>
                            IP Addr : {mgmtIp || "미입력"}
                            <br />
                            Gateway : {mgmtGateway || "미입력"}
                            <br />
                            DNS : {mgmtDns || "미입력"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>서비스 NIC 정보</DescriptionListTerm>
                          <DescriptionListDescription>
                            IP Addr : {svcEnabled ? svcIp || "미입력" : "N/A"}
                            <br />
                            Gateway : {svcEnabled ? svcGateway || "미입력" : "N/A"}
                            <br />
                            DNS : {svcEnabled ? svcDns || "미입력" : "N/A"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>

                <div className="ct-cloud-vm-wizard__review-section">
                  <button
                    type="button"
                    className="ct-cloud-vm-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, ssh: !prev.ssh }))}
                  >
                    <span>SSH Key 정보</span>
                    <span className={reviewOpen.ssh ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                      ▾
                    </span>
                  </button>
                  {reviewOpen.ssh && (
                    <div className="ct-cloud-vm-wizard__review-body">
                      <DescriptionList isCompact className="ct-cloud-vm-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>SSH 개인 Key 파일</DescriptionListTerm>
                          <DescriptionListDescription>
                            <TextArea
                              aria-label="SSH 개인 Key 설정 확인"
                              readOnly
                              value={sshPrivateKey || sshPrivateFilename || "현재 호스트 id_rsa 자동 사용"}
                              rows={5}
                              className="ct-cloud-vm-wizard__review-textarea"
                            />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>SSH 공개 Key 파일</DescriptionListTerm>
                          <DescriptionListDescription>
                            <TextArea
                              aria-label="SSH 공개 Key 설정 확인"
                              readOnly
                              value={sshPublicKey || sshPublicFilename || "현재 호스트 id_rsa.pub 자동 사용"}
                              rows={4}
                              className="ct-cloud-vm-wizard__review-textarea"
                            />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>

                <div className="ct-cloud-vm-wizard__review-section">
                  <button
                    type="button"
                    className="ct-cloud-vm-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, cluster: !prev.cluster }))}
                  >
                    <span>장애조치 클러스터 설정</span>
                    <span className={reviewOpen.cluster ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                      ▾
                    </span>
                  </button>
                  {reviewOpen.cluster && (
                    <div className="ct-cloud-vm-wizard__review-body">
                      <DescriptionList isCompact className="ct-cloud-vm-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>클러스터 멤버 수</DescriptionListTerm>
                          <DescriptionListDescription>{failoverMembers}</DescriptionListDescription>
                        </DescriptionListGroup>
                        {failoverHosts.slice(0, failoverMembers).map((host, index) => (
                          <DescriptionListGroup key={`cloud-vm-failover-review-${index}`}>
                            <DescriptionListTerm>PCS 호스트 #{index + 1}</DescriptionListTerm>
                            <DescriptionListDescription>PN IP : {host || "미입력"}</DescriptionListDescription>
                          </DescriptionListGroup>
                        ))}
                      </DescriptionList>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WizardStep>

          <WizardStep name="배포" id="cloud-vm-deploy">
            <div className="ct-cloud-vm-wizard__content">
              <Content component="p" className="ct-cloud-vm-wizard__deploy-title">
                클라우드센터 가상머신을 배포 중입니다. 전체 5단계 중 4단계 진행 중입니다.
              </Content>
              <div className="ct-cloud-vm-wizard__status-list">
                <div>
                  <Label color="green" variant="outline">완료</Label>
                  <span>클러스터 구성 HOST 네트워크 연결 테스트</span>
                </div>
                <div>
                  <Label color="green" variant="outline">완료</Label>
                  <span>클러스터 구성 설정 초기화 작업</span>
                </div>
                <div>
                  <Label color="green" variant="outline">완료</Label>
                  <span>cloudinit iso 파일 생성</span>
                </div>
                <div>
                  <Label color={isDeployStarted ? "orange" : "blue"} variant="outline">
                    {isDeployStarted ? "진행중" : "준비중"}
                  </Label>
                  {isDeployStarted && <Spinner size="sm" aria-label="진행중" />}
                  <span>클라우드센터 가상머신 구성</span>
                </div>
                <div>
                  <Label color="blue" variant="outline">준비중</Label>
                  <span>클러스터 구성 및 클라우드센터 가상머신 배포</span>
                </div>
              </div>
            </div>
          </WizardStep>

          <WizardStep name="완료" id="cloud-vm-finish">
            <div className="ct-cloud-vm-wizard__content">
              <Content>
                <Content component="p">
                  클라우드센터 VM의 배포를 완료했습니다. 가상머신이 배포되면 다음의 작업을 수행해야 합니다.
                </Content>
                <Content component="ul">
                  <Content component="li">클라우드센터 VM의 웹관리콘솔에 접속</Content>
                  <Content component="li">ABLESTACK에 대한 클라우드 Zone 구성</Content>
                  <Content component="li">가상머신 생성을 위한 각종 정책 준비</Content>
                </Content>
                <Content component="p">위의 모든 작업은 클라우드센터 VM의 웹 관리콘솔을 이용해 진행합니다.</Content>
              </Content>
            </div>
          </WizardStep>
        </Wizard>
      </Modal>
      <Modal
        isOpen={showDeployConfirm}
        variant="small"
        aria-label="클라우드센터 가상머신 배포 진행 확인"
        onClose={() => setShowDeployConfirm(false)}
      >
        <ModalHeader title="클라우드센터 가상머신 배포 진행" />
        <ModalBody>
          <Content component="p">클라우드센터 가상머신 배포를 진행하시겠습니까?</Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={executeMockDeploy}>
            실행
          </Button>
          <Button variant="link" onClick={() => setShowDeployConfirm(false)}>
            아니요
          </Button>
        </ModalFooter>
      </Modal>
      <Modal
        isOpen={showCancelConfirm}
        variant="small"
        aria-label="클라우드센터 가상머신 배포 취소 확인"
        onClose={() => setShowCancelConfirm(false)}
      >
        <ModalHeader title="클라우드센터 가상머신 배포 취소" />
        <ModalBody>
          <Content component="p">
            클라우드센터 가상머신 배포를 취소하시겠습니까? 입력된 데이터는 초기화 됩니다.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleClose}>
            실행
          </Button>
          <Button variant="link" onClick={() => setShowCancelConfirm(false)}>
            아니요
          </Button>
        </ModalFooter>
      </Modal>
      <ValidationErrorModal
        isOpen={Boolean(validationMessage)}
        message={validationMessage}
        onClose={() => setValidationMessage("")}
      />
    </>
  );
}
