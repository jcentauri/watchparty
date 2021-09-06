import React from 'react';
import { serverPath, colorMappings, getUserImage } from '../../utils';
import { Icon, Popup, Button, Dropdown, Image } from 'semantic-ui-react';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { LoginModal } from '../Modal/LoginModal';
import axios from 'axios';
import { SubscribeButton } from '../SubscribeButton/SubscribeButton';
import { ProfileModal } from '../Modal/ProfileModal';

export class NewRoomButton extends React.Component<{
  user: firebase.User | undefined;
  size?: string;
  openNewTab?: boolean;
}> {
  createRoom = async () => {
    const uid = this.props.user?.uid;
    const token = await this.props.user?.getIdToken();
    const response = await window.fetch(serverPath + '/createRoom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        token,
      }),
    });
    const data = await response.json();
    const { name } = data;
    if (this.props.openNewTab) {
      window.open('/#' + name);
    } else {
      window.location.assign('/#' + name);
    }
  };
  render() {
    return (
      <Popup
        content="Create a new room with a random URL that you can share with friends"
        trigger={
          <Button
            color="blue"
            size={this.props.size as any}
            icon
            labelPosition="left"
            onClick={this.createRoom}
            className="toolButton"
            fluid
          >
            <Icon name="certificate" />
            New Room
          </Button>
        }
      />
    );
  }
}

type SignInButtonProps = {
  user: firebase.User | undefined;
  fluid?: boolean;
};

export class SignInButton extends React.Component<SignInButtonProps> {
  public state = { isLoginOpen: false, isProfileOpen: false, userImage: null };

  async componentDidUpdate(prevProps: SignInButtonProps) {
    if (!prevProps.user && this.props.user) {
      this.setState({ userImage: await getUserImage(this.props.user) });
    }
  }

  facebookSignIn = async () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  };

  googleSignIn = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  };

  signOut = () => {
    firebase.auth().signOut();
    window.location.reload();
  };

  render() {
    if (this.props.user) {
      return (
        <div
          style={{
            margin: '4px',
            width: '100px',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Image
            avatar
            src={this.state.userImage}
            onClick={() => this.setState({ isProfileOpen: true })}
          />
          {this.state.isProfileOpen && this.props.user && (
            <ProfileModal
              user={this.props.user}
              userImage={this.state.userImage}
              close={() => this.setState({ isProfileOpen: false })}
            />
          )}
        </div>
      );
    }
    return (
      <React.Fragment>
        {this.state.isLoginOpen && (
          <LoginModal
            closeLogin={() => this.setState({ isLoginOpen: false })}
          />
        )}
        <Popup
          basic
          content="Sign in to set your name and picture, subscribe, or launch VBrowsers"
          trigger={
            <Dropdown
              style={{ height: '36px' }}
              icon="sign in"
              labeled
              className="icon"
              button
              text="Sign in"
              fluid={this.props.fluid}
            >
              <Dropdown.Menu>
                <Dropdown.Item onClick={this.facebookSignIn}>
                  <Icon name="facebook" />
                  Facebook
                </Dropdown.Item>
                <Dropdown.Item onClick={this.googleSignIn}>
                  <Icon name="google" />
                  Google
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => this.setState({ isLoginOpen: true })}
                >
                  <Icon name="mail" />
                  Email
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
        />
      </React.Fragment>
    );
  }
}

export class ListRoomsButton extends React.Component<{
  user: firebase.User | undefined;
}> {
  public state = { rooms: [] as PermanentRoom[] };

  componentDidMount() {
    this.refreshRooms();
  }

  refreshRooms = async () => {
    if (this.props.user) {
      const token = await this.props.user.getIdToken();
      const response = await axios.get(
        serverPath + `/listRooms?uid=${this.props.user?.uid}&token=${token}`
      );
      this.setState({ rooms: response.data });
    }
  };

  deleteRoom = async (roomId: string) => {
    if (this.props.user) {
      const token = await this.props.user.getIdToken();
      await axios.delete(
        serverPath +
          `/deleteRoom?uid=${this.props.user?.uid}&token=${token}&roomId=${roomId}`
      );
      this.setState({
        rooms: this.state.rooms.filter((room) => room.roomId !== roomId),
      });
      this.refreshRooms();
    }
  };

  render() {
    return (
      <Dropdown
        style={{ height: '36px' }}
        icon="group"
        labeled
        className="icon"
        button
        text="My Rooms"
        onClick={this.refreshRooms}
        scrolling
      >
        <Dropdown.Menu>
          {this.state.rooms.length === 0 && (
            <Dropdown.Item disabled>You have no permanent rooms.</Dropdown.Item>
          )}
          {this.state.rooms.map((room: any) => {
            return (
              <Dropdown.Item
                link
                href={
                  room.vanity
                    ? '/r/' + room.vanity
                    : '/' + room.roomId.replace('/', '#')
                }
                onClick={() => {
                  if (!room.vanity) {
                    setTimeout(() => window.location.reload(), 100);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {room.vanity
                    ? `/r/${room.vanity}`
                    : room.roomId.replace('/', '#')}
                  <div style={{ marginLeft: 'auto', paddingLeft: '20px' }}>
                    <Button
                      icon
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        this.deleteRoom(room.roomId);
                      }}
                      color="red"
                      size="mini"
                    >
                      <Icon name="trash" />
                    </Button>
                  </div>
                </div>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}

export class TopBar extends React.Component<{
  user?: firebase.User;
  hideNewRoom?: boolean;
  hideSignin?: boolean;
  hideMyRooms?: boolean;
  isSubscriber: boolean;
  isCustomer: boolean;
}> {
  render() {
    const subscribeButton = (
      <SubscribeButton
        user={this.props.user}
        isSubscriber={this.props.isSubscriber ?? false}
        isCustomer={this.props.isCustomer ?? false}
      />
    );
    return (
      <React.Fragment>
        <div
          style={{
            display: 'none',
            flexWrap: 'wrap',
            padding: '1em',
            paddingBottom: '0px',
          }}
        >
          <a href="/" style={{ display: 'flex' }}>
            <div
              style={{
                height: '48px',
                width: '48px',
                marginRight: '10px',
                borderRadius: '50%',
                position: 'relative',
                backgroundColor: '#' + colorMappings.blue,
                display: 'none',  
              }}
            >
              <Icon
                inverted
                name="film"
                size="large"
                style={{
                  position: 'absolute',
                  top: 8,
                  width: '100%',
                  margin: '0 auto',
                  display: 'none',  
                }}
              />
              <Icon
                inverted
                name="group"
                size="large"
                color="green"
                style={{
                  position: 'absolute',
                  bottom: 8,
                  width: '100%',
                  margin: '0 auto',
                  display: 'none',
                }}
              />
            </div>
            <div
              style={{
                display: 'none',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#2185d0',
                  fontSize: '30px',
                  lineHeight: '30px',
                  display: 'none',
                }}
              >
                Watch
              </div>
              <div
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#21ba45',
                  fontSize: '30px',
                  lineHeight: '30px',
                  marginLeft: 'auto',
                  display: 'none',  
                }}
              >
                Party
              </div>
            </div>
          </a>
          <div
            style={{
              display: 'none',
              marginLeft: '10px',
              alignItems: 'center',
            }}
          >
            <a
              href=" "
              target="_blank"
              rel="noopener noreferrer"
              className="footerIcon"
              title="Discord"
            >
              <Icon name="discord" size="big" link />
            </a>
            <a
              href=" "
              target="_blank"
              rel="noopener noreferrer"
              className="footerIcon"
              title="GitHub"
            >
              <Icon name="github" size="big" link />
            </a>
          </div>
          <div
            className="mobileStack"
            style={{
              display: 'none',
              marginLeft: 'auto',
              gap: '4px',
            }}
          >
            {!this.props.hideNewRoom && (
              <NewRoomButton user={this.props.user} openNewTab />
            )}
            {!this.props.hideMyRooms && this.props.user && (
              <ListRoomsButton user={this.props.user} />
            )}
            {subscribeButton}
            {!this.props.hideSignin && <SignInButton user={this.props.user} />}
          </div>
        </div>
      </React.Fragment>
    );
  }
}
