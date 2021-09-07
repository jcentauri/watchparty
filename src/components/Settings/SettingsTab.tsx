import React, { useState, useCallback } from 'react';
import {
  Icon,
  Divider,
  Radio,
  CheckboxProps,
  Message,
  Input,
  Button,
  Label,
} from 'semantic-ui-react';
// import { SignInButton } from '../TopBar/TopBar';
import { getCurrentSettings, updateSettings } from './LocalSettings';
import axios from 'axios';
import { serverPath } from '../../utils';
import { PermanentRoomModal } from '../Modal/PermanentRoomModal';

interface SettingsTabProps {
  hide: boolean;
  user: firebase.User | undefined;
  roomLock: string;
  setRoomLock: Function;
  socket: SocketIOClient.Socket;
  isSubscriber: boolean;
  roomId: string;
  owner: string | undefined;
  setOwner: Function;
  vanity: string | undefined;
  setVanity: Function;
  roomLink: string;
  password: string | undefined;
  setPassword: Function;
  isChatDisabled: boolean;
  setIsChatDisabled: Function;
  clearChat: Function;
}

export const SettingsTab = ({
  hide,
  user,
  roomLock,
  setRoomLock,
  socket,
  isSubscriber,
  owner,
  vanity,
  setVanity,
  roomLink,
  password,
  setPassword,
  isChatDisabled,
  setIsChatDisabled,
  clearChat,
}: SettingsTabProps) => {
  const [updateTS, setUpdateTS] = useState(0);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [validVanity, setValidVanity] = useState(true);
  const [validVanityLoading, setValidVanityLoading] = useState(false);
  const [adminSettingsChanged, setAdminSettingsChanged] = useState(false);

  const setRoomState = useCallback(
    async (data: any) => {
      const token = await user?.getIdToken();
      socket.emit('CMD:setRoomState', {
        uid: user?.uid,
        token,
        ...data,
      });
    },
    [socket, user]
  );
  const setRoomOwner = useCallback(
    async (data: any) => {
      const token = await user?.getIdToken();
      socket.emit('CMD:setRoomOwner', {
        uid: user?.uid,
        token,
        ...data,
      });
    },
    [socket, user]
  );
  const checkValidVanity = useCallback(
    async (input: string) => {
      if (!input) {
        setValidVanity(true);
        return;
      }
      setValidVanity(false);
      setValidVanityLoading(true);
      const response = await axios.get(serverPath + '/resolveRoom/' + input);
      const data = response.data;
      setValidVanityLoading(false);
      if (
        data &&
        data.vanity &&
        data.vanity !== roomLink.split('/').slice(-1)[0]
      ) {
        // Already exists and doesn't match current room
        setValidVanity(false);
      } else {
        setValidVanity(true);
      }
    },
    [setValidVanity, roomLink]
  );


  const permanentEnabled =
    Boolean(user);
  

  return (
    <div
      style={{
        display: hide ? 'none' : 'block',
        color: 'white',
        overflow: 'scroll',
        padding: '8px',
      }}
    >
      {permModalOpen && (
        <PermanentRoomModal
          closeModal={() => setPermModalOpen(false)}
        ></PermanentRoomModal>
      )}
      
 

      
     <SettingRow
          icon={'clock'}
          name={`Make Room Permanent`}
          description={
            'Prevent this room from expiring. This also unlocks additional room features.'
          }
          helpIcon={
            <Icon
              name="help circle"
              onClick={() => setPermModalOpen(true)}
              style={{ cursor: 'pointer' }}
            ></Icon>
          }
          
         checked={Boolean(user)}
         disabled={!(permanentEnabled)}   


        />


      
      {owner && owner === user?.uid && (
        <div className="sectionHeader">Admin Settings</div>
      )}
      {owner && owner === user?.uid && (
        <SettingRow
          icon={'key'}
          name={`Set Room Password`}
          description="Users must know this password in order to join the room."
          content={
            <Input
              value={password}
              size="mini"
              onChange={(e) => {
                setAdminSettingsChanged(true);
                setPassword(e.target.value);
              }}
              fluid
            />
          }
          disabled={false}
        />
      )}
      {owner && owner === user?.uid && (
        <SettingRow
          icon={'i cursor'}
          name={`Disable Chat`}
          description="Prevent users from sending messages in chat."
          checked={Boolean(isChatDisabled)}
          disabled={false}
          onChange={(_e, data) => {
            setAdminSettingsChanged(true);
            setIsChatDisabled(Boolean(data.checked));
          }}
        />
      )}
      {owner && owner === user?.uid && (
        <SettingRow
          icon={'i delete'}
          name={`Clear Chat`}
          description="Delete all existing chat messages"
          disabled={false}
          content={
            <Button
              color="red"
              icon
              labelPosition="left"
              onClick={() => clearChat()}
            >
              <Icon name="delete" />
              Delete Messages
            </Button>
          }
        />
      )}
      {owner && owner === user?.uid && (
        <SettingRow
          icon={'linkify'}
          name={`Set Custom Room URL`}
          description="Set a custom URL for this room. Inappropriate names may be revoked."
          checked={Boolean(roomLock)}
          disabled={!isSubscriber}
          subOnly={true}
          content={
            <React.Fragment>
              <Input
                value={vanity}
                disabled={!isSubscriber}
                onChange={(e) => {
                  setAdminSettingsChanged(true);
                  checkValidVanity(e.target.value);
                  setVanity(e.target.value);
                }}
                label={<Label>{`${window.location.origin}/r/`}</Label>}
                loading={validVanityLoading}
                fluid
                size="mini"
                icon
                action={
                  validVanity ? (
                    <Icon name="checkmark" color="green" />
                  ) : (
                    <Icon name="close" color="red" />
                  )
                }
              ></Input>
            </React.Fragment>
          }
        />
      )}
      <p />
     
        <Button
          primary
          disabled={!validVanity || !adminSettingsChanged}
          labelPosition="left"
          icon
          fluid
          onClick={() => {
            setRoomState({
              vanity: vanity,
              password: password,
              isChatDisabled: isChatDisabled,
            });
            setAdminSettingsChanged(false);
          }}
        >
          <Icon name="save" />
          Save Admin Settings
        </Button>
   
      {/* MEDIA_PATH */}
      <div className="sectionHeader">Local Settings</div>
      <SettingRow
        updateTS={updateTS}
        icon="bell"
        name="Disable chat notification sound"
        description="Don't play a sound when a chat message is sent while you're on another tab"
        checked={Boolean(getCurrentSettings().disableChatSound)}
        disabled={false}
        onChange={(_e, data) => {
          updateSettings(
            JSON.stringify({
              ...getCurrentSettings(),
              disableChatSound: data.checked,
            })
          );
          setUpdateTS(Number(new Date()));
        }}
      />
  

   </div>
  );
};

const SettingRow = ({
  icon,
  name,
  description,
  checked,
  disabled,
  onChange,
  content,
  subOnly,
  helpIcon,
}: {
  icon: string;
  name: string;
  description?: React.ReactNode;
  checked?: boolean;
  disabled: boolean;
  updateTS?: number;
  onChange?: (e: React.FormEvent, data: CheckboxProps) => void;
  content?: React.ReactNode;
  subOnly?: boolean;
  helpIcon?: React.ReactNode;
}) => {
  return (
    <React.Fragment>
      <Divider inverted horizontal />
      <div>
        <div style={{ display: 'flex' }}>
          <Icon size="large" name={icon as any} />
          <div>
            {name} {helpIcon}
            {subOnly ? (
              <Label size="mini" color="orange">
                Subscriber only
              </Label>
            ) : null}
          </div>
          {!content && (
            <Radio
              style={{ marginLeft: 'auto' }}
              toggle
              checked={checked}
              disabled={disabled}
              onChange={onChange}
            />
          )}
        </div>
        <div className="smallText" style={{ marginBottom: '8px' }}>
          {description}
        </div>
        {content}
      </div>
    </React.Fragment>
  );
};
